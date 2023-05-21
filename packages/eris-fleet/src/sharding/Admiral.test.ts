import {describe, expect, test, beforeAll} from "@jest/globals";
import {Fleet, BaseClusterWorker, BaseServiceWorker} from "../index";
import {inspect} from "util";
import nodeCluster from "cluster";

// FIXME: clustering does not work, need to mock it or something

class BotWorker extends BaseClusterWorker {
	constructor(setup: any) {
		super(setup);
		console.log("spawned");
	}

	handleCommand(data: any) {
		return data;
	}
}

class ServiceWorker extends BaseServiceWorker {
	constructor(setup: any) {
		super(setup);
		console.log("spawned");
		this.serviceReady();
	}

	handleCommand(data: any) {
		return data;
	}
}

const options = {
	BotWorker,
	//services: [{name: "test", ServiceWorker}],
	token: process.env.token!,
	clusters: 2,
	shards: 2
};

const Admiral = new Fleet(options);

if (nodeCluster.isMaster) {
	Admiral.on("log", m => console.log(m));
	Admiral.on("debug", m => console.debug(m));
	Admiral.on("warn", m => console.warn(m));
	Admiral.on("error", m => console.error(inspect(m)));
	Admiral.on("stats", m => console.log(m));

	const waiting = new Promise((res) => {
		Admiral.once("ready", res);
	});

	describe("Admiral test", () => {
		beforeAll(async () => {
			await waiting;
		}, 30e3);

		test("Cluster count test", () => {
			expect(Admiral.clusters.size).toBe(2);
		});

		test("Fetch user", async () => {
			const user = await Admiral.ipc.fetchUser(Admiral.bot!.user.id);
			expect(user.id).toBe(Admiral.bot!.user.id);
		});

		test("Fetch guild", async () => {
			const guild = await Admiral.ipc.fetchGuild(process.env.fetch_guild_id!);
			expect(guild.id).toBe(process.env.fetch_guild_id!);
		});

		test("Fetch channel", async () => {
			const channel = await Admiral.ipc.fetchChannel(process.env.fetch_channel_id!);
			expect(channel.id).toBe(process.env.fetch_channel_id!);
		});

		test("Fetch member", async () => {
			const member = await Admiral.ipc.fetchMember(Admiral.bot!.user.id, process.env.fetch_guild_id!);
			expect(member.id).toBe(Admiral.bot!.user.id);
			expect(member.guild.id).toBe(process.env.fetch_guild_id!);
		});

		test("Service command", async () => {
			const msg = "hello";
			const res = await Admiral.ipc.serviceCommand("test", msg, true, 5e3);
			expect(res).toBe(msg);
		});

		test("cluster command", async () => {
			const msg = "hello";
			const res = await Admiral.ipc.clusterCommand(0, msg, true, 5e3);
			expect(res).toBe(msg);
		});

		test("all cluster command", async () => {
			const msg = "hello";
			const res = await Admiral.ipc.allClustersCommand(msg, true, 5e3);
			expect(res).toBeDefined();
			expect(res!.get(0)).toBe(msg);
			expect(res!.get(1)).toBe(msg);
		});
	});
}