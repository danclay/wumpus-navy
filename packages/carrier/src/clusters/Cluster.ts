import { ClusterConnectMessage } from "./../util/Queue";
import nodeCluster from "cluster";
import {BaseClusterWorker} from "./BaseClusterWorker";
import {inspect} from "util";
import {LoggingOptions} from "../sharding/Admiral";
import { IPC } from "../util/IPC";

export interface ClusterInput<LibClientType, LibClient, LibLatencyRef> {
	LibClient: LibClientType;
	fetchTimeout: number;
	overrideConsole: boolean;
	BotWorker?: typeof BaseClusterWorker<LibClient, LibLatencyRef>;
}

/** @internal */
export class Cluster<LibClient, LibClientType, LibClientOptions, LibLatencyRef, LibClientStatus> {
	firstShardID?: number;
	lastShardID?: number;
	path?: string;
	clusterID?: number;
	clusterCount?: number;
	shardCount?: number;
	shards?: number;
	clientOptions?: LibClientOptions;
	whatToLog?: LoggingOptions[];
	useCentralRequestHandler?: boolean;
	bot?: LibClient;
	token?: string;
	app?: BaseClusterWorker<LibClient, LibLatencyRef>;
	App?: typeof BaseClusterWorker<LibClient, LibLatencyRef>;
	ipc: IPC<LibLatencyRef>;
	shuttingDown?: boolean;
	startingStatus?: LibClientStatus;
	loadClusterCodeImmediately!: boolean;
	resharding!: boolean;
	BotWorker?: typeof BaseClusterWorker<LibClient, LibLatencyRef>;
	connect?(): Promise<void>;
	//public handleCommand?(data: any): any;
	disconnect?(): Promise<void>;
	fetchUser?(id: string): Promise<unknown | undefined>;
	fetchChannel?(id: string): Promise<unknown | undefined>;
	fetchGuild?(id: string): Promise<unknown | undefined>;
	fetchMember?(guildID: string, memberID: string): Promise<any | undefined>;
	collectStats?(): Promise<any | undefined>;

	constructor(input: ClusterInput<LibClientType, LibClient, LibLatencyRef>) {
		this.BotWorker = input.BotWorker;
		// add ipc
		this.ipc = new IPC({fetchTimeout: input.fetchTimeout});

		if (input.overrideConsole) {
			console.log = (str: unknown) => {this.ipc.log(str);};
			console.info = (str: unknown) => {this.ipc.info(str);};
			console.debug = (str: unknown) => {this.ipc.debug(str);};
			console.error = (str: unknown) => {this.ipc.error(str);};
			console.warn = (str: unknown) => {this.ipc.warn(str);};
		}

		//Spawns
		process.on("uncaughtException", (err: Error) => {
			this.ipc.error(err);
		});

		process.on("unhandledRejection", (reason, promise) => {
			this.ipc.error("Unhandled Rejection at: " + inspect(promise) + " reason: " + reason);
		});

		if (process.send) process.send({op: "launched"});
		
		process.on("message", async (message: any) => {
			if (message.op) {
				switch (message.op) {
				case "connect": {
					const connectMessage = message as ClusterConnectMessage<LibClientOptions, LibClientStatus>;
					this.firstShardID = connectMessage.firstShardID;
					this.lastShardID = connectMessage.lastShardID;
					this.path = connectMessage.path;
					this.clusterID = connectMessage.clusterID;
					this.clusterCount = connectMessage.clusterCount;
					this.shardCount = connectMessage.shardCount;
					this.shards = (this.lastShardID - this.firstShardID) + 1;
					this.clientOptions = connectMessage.clientOptions;
					this.token = connectMessage.token;
					this.whatToLog = connectMessage.whatToLog;
					this.useCentralRequestHandler = connectMessage.useCentralRequestHandler;
					this.loadClusterCodeImmediately = connectMessage.loadClusterCodeImmediately;
					this.resharding = connectMessage.resharding;
					if (connectMessage.startingStatus) this.startingStatus = connectMessage.startingStatus;

					if (this.shards < 0) return;
					this.connect!();

					break;
				}
				case "fetchUser": {
					if (!this.bot) return;
					const user = await this.fetchUser!(message.id);
					if (user) {
						if (process.send) process.send({op: "return", value: user, UUID: message.UUID});
					} else {
						if (process.send) process.send({op: "return", value: {id: message.id, noValue: true}, UUID: message.UUID});
					}
						
					break;
				}
				case "fetchChannel": {
					if (!this.bot) return;
					const channel = await this.fetchChannel!(message.id);
					if (channel) {
						if (process.send) process.send({op: "return", value: channel, UUID: message.UUID});
					} else {
						if (process.send) process.send({op: "return", value: {id: message.id, noValue: true}, UUID: message.UUID});
					}

					break;
				}
				case "fetchGuild": {
					if (!this.bot) return;
					const guild = await this.fetchGuild!(message.id);
					if (guild) {
						if (process.send) process.send({op: "return", value: guild, UUID: message.UUID});
					} else {
						if (process.send) process.send({op: "return", value: {id: message.id, noValue: true}, UUID: message.UUID});
					}

					break;
				}
				case "fetchMember": {
					if (!this.bot) return;
					const messageParsed = JSON.parse(message.id);
					const member = await this.fetchMember!(messageParsed.guildID, messageParsed.memberID);
					if (member) {
						member.id = message.id;
						if (process.send) process.send({op: "return", value: member, UUID: message.UUID});
					} else {
						if (process.send) process.send({op: "return", value: {id: message.id, noValue: true}, UUID: message.UUID});
					}

					break;
				}
				case "command": {
					const noHandle = () => {
						const res = {err: `Cluster ${this.clusterID} cannot handle commands!`};
						if (process.send) process.send({op: "return", value: {
							id: message.command.UUID,
							value: res,
							clusterID: this.clusterID
						}, UUID: message.UUID});
						this.ipc.error("I can't handle commands!");
					};
					if (this.app) {
						if (this.app.handleCommand) {
							const res = await this.app.handleCommand(message.command.msg as never);
							if (message.command.receptive) {
								if (process.send) process.send({op: "return", value: {
									id: message.command.UUID,
									value: res,
									clusterID: this.clusterID
								}, UUID: message.UUID});
							}
						} else {
							noHandle();
						}
					} else {
						noHandle();
					}

					break;
				}
				case "eval": {
					const errorEncountered = (err: unknown) => {
						if (message.request.receptive) {
							if (process.send) process.send({op: "return", value: {
								id: message.request.UUID,
								value: {err},
								clusterID: this.clusterID
							}, UUID: message.UUID});
						}
					};
					if (this.app) {
						this.app.runEval(message.request.stringToEvaluate)
							.then((res: unknown) => {
								if (message.request.receptive) {
									if (process.send) process.send({op: "return", value: {
										id: message.request.UUID,
										value: res,
										clusterID: this.clusterID
									}, UUID: message.UUID});
								}
							}).catch((error: unknown) => {
								errorEncountered(error);
							});
					} else {
						errorEncountered("Cluster is not ready!");
					}

					break;
				}
				case "return": {
					if (this.app) this.ipc.emit(message.id, message.value);
					break;
				}
				case "collectStats": {
					if (!this.bot) return;
					const stats = await this.collectStats!();

					if (process.send) process.send({op: "collectStats", stats});

					break;
				}
				case "shutdown": {
					this.shuttingDown = true;
					if (this.app) {
						if (this.app.shutdown) {
							// Ask app to shutdown
							this.app.shutdown(() => {
								this.disconnect!();
								if (process.send) process.send({op: "shutdown"});
							});
						} else {
							this.disconnect!();
							if (process.send) process.send({op: "shutdown"});
						}
					} else {
						this.disconnect!();
						if (process.send) process.send({op: "shutdown"});
					}

					break;
				}
				case "loadCode": {
					this.loadCode();

					break;
				}
				}
			}
		});
	}

	async loadCode() {
		if (this.app) return;
		//let App = (await import(this.path)).default;
		//App = App.default ? App.default : App;
		try {
			this.app = new this.App!({bot: this.bot!, clusterID: this.clusterID!, workerID: nodeCluster.worker!.id, ipc: this.ipc});
			if (!this.app) return;
			if (process.send) process.send({op: "codeLoaded"});
		} catch (e) {
			this.ipc.error(e);
			// disconnect bot
			this.disconnect!();
			// kill cluster
			process.exit(1);
		}
	}
}