import { Client, ClientOptions, LatencyRef } from "eris";
import * as Carrier from "wumpus-carrier";
import { CentralRequestHandler } from "./CentralRequestHandler";
import { inspect } from "util";
import { LibClientStatus } from "../sharding/Admiral";

export class AdaptedCluster extends Carrier.Cluster<Client, typeof Client, ClientOptions, LatencyRef, LibClientStatus> {
	private LibClient: typeof Client;

	constructor(input: Carrier.ClusterInput<typeof Client, Client, LatencyRef>) {
		super(input);
		this.LibClient = input.LibClient;
	}

	// connect method
	async connect() {
		if (this.whatToLog!.includes("cluster_start")) this.ipc.log(`Connecting with ${this.shards} shard(s) (${this.firstShardID} - ${this.lastShardID})`);
	
		const options = Object.assign(this.clientOptions!, {autoreconnect: true, firstShardID: this.firstShardID, lastShardID: this.lastShardID, maxShards: this.shardCount});
	
		let bot;
		let App;
		if (this.BotWorker) {
			App = this.BotWorker;
			bot = new this.LibClient(this.token!, options);
		} else {
			try {
				App = await import(this.path!);
				if (App.Eris) {
					bot = new App.Eris.Client(this.token, options);
					App = App.BotWorker;
				} else {
					bot = new this.LibClient(this.token!, options);
					if (App.BotWorker) {
						App = App.BotWorker;
					} else {
						App = App.default ? App.default : App;
					}
				}
			} catch (e) {
				this.ipc.error(e);
				process.exit(1);
			}
		}
		this.App = App;
	
		// central request handler
		if (this.useCentralRequestHandler) {
			bot.requestHandler = new CentralRequestHandler({
				timeout: bot.options.requestTimeout
			});
		}
	
		this.bot = bot as Client;
	
		const setStatus = () => {
			if (this.startingStatus) {
					this.bot!.editStatus(this.startingStatus.status, this.startingStatus.activities);
			}
		};
	
		// load code if immediate code loading is enabled
		if (this.loadClusterCodeImmediately && !this.resharding) this.loadCode();
	
		bot.on("connect", (id: number) => {
			if (process.send) process.send({
				op: "shardUpdate",
				shardID: id,
				clusterID: this.clusterID,
				type: "shardConnect"
			});
		});
	
		bot.on("shardDisconnect", (err: Error, id: number) => {
			if (process.send) process.send({
				op: "shardUpdate",
				shardID: id,
				clusterID: this.clusterID,
				type: "shardDisconnect",
				err: inspect(err)
			});
		});
	
		bot.once("shardReady", () => {
			setStatus();
		});
	
		bot.on("shardReady", (id: number) => {
			if (process.send) process.send({
				op: "shardUpdate",
				shardID: id,
				clusterID: this.clusterID,
				type: "shardReady"
			});
		});
	
		bot.on("shardResume", (id: number) => {
			if (process.send) process.send({
				op: "shardUpdate",
				shardID: id,
				clusterID: this.clusterID,
				type: "shardResume"
			});
		});
	
		bot.on("warn", (message: string, id?: number) => {
			this.ipc.warn(message, `Cluster ${this.clusterID}, Shard ${id}`);
		});
	
		bot.on("error", (error: Error, id?: number) => {
			this.ipc.error(error, `Cluster ${this.clusterID}, Shard ${id}`);
		});
	
		bot.on("ready", () => {
			if (this.whatToLog!.includes("cluster_ready")) this.ipc.log(`Shards ${this.firstShardID} - ${this.lastShardID} are ready!`);
		});
	
		bot.once("ready", () => {
			if (process.send) process.send({op: "connected"});
		});
	
		// Connects the bot
		bot.connect();
	}

	// for shutdowns
	async disconnect() {
		if (this.bot) this.bot.disconnect({reconnect: false});
	}

	// fetches
	async fetchUser(userID: string) {
		if (!this.bot) return;
		return this.bot.users.get(userID);
	}
	async fetchChannel(channelID: string) {
		if (!this.bot) return;
		return this.bot.getChannel(channelID);
	}
	async fetchGuild(guildID: string) {
		if (!this.bot) return;
		return this.bot.guilds.get(guildID);
	}
	async fetchMember(guildID: string, memberID: string) {
		if (!this.bot) return;
		const guild = this.bot.guilds.get(guildID);
		if (guild) {
			const member = guild.members.get(memberID);
			if (member) {
				return member.toJSON();
			} else {
				return;
			}
		} else {
			return;
		}
	}
	async collectStats() {
		if (!this.bot) return;
		const shardStats: Carrier.ShardStats[] = [];
		const getShardUsers = (id: number) => {
			let users = 0;
					this.bot!.guildShardMap;
					this.bot!.guilds.forEach(guild => {
						if (this.bot!.guildShardMap[guild.id] !== id) return;
						users += guild.memberCount;
					});
					return users;
		};
		let totalMembers = 0;
		this.bot.shards.forEach(shard => {
			const shardUsers = getShardUsers(shard.id);
			totalMembers += shardUsers;
			shardStats.push({
				id: shard.id,
				ready: shard.ready,
				latency: shard.latency,
				status: shard.status,
				guilds: Object.values(this.bot!.guildShardMap).filter(e => e === shard.id).length,
				users: shardUsers,
				members: shardUsers
			});
		});
		return {
			guilds: this.bot.guilds.size,
			users: this.bot.users.size,
			members: totalMembers,
			uptime: this.bot.uptime,
			voice: this.bot.voiceConnections.size,
			largeGuilds: this.bot.guilds.filter(g => g.large).length,
			shardStats: shardStats,
			shards: shardStats,
			ram: process.memoryUsage().rss / 1e6,
			ipcLatency: new Date().getTime(),
			requestHandlerLatencyRef: this.useCentralRequestHandler ? undefined : this.bot.requestHandler.latencyRef
		};
	}
}