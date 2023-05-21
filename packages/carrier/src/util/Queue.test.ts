import {describe, expect, test, beforeEach} from "@jest/globals";
import {QueueItem, Queue} from "./Queue";

// chatgpt written
describe("Queue", () => {
	let queue: Queue;

	beforeEach(() => {
		queue = new Queue();
	});

	test("should add an item to the queue", () => {
		const item: QueueItem = {
			type: "service",
			workerID: 1,
			message: {
				serviceName: "example",
				op: "connect",
				timeout: 5000,
				whatToLog: ["admiral_start"],
			},
		};

		queue.item(item);

		expect(queue.queue.length).toBe(1);
		expect(queue.queue[0]).toEqual(item);
	});

	test("should add multiple items to the queue in bulk", () => {
		const items: QueueItem[] = [
			{
				type: "cluster",
				workerID: 1,
				message: {
					clusterID: 1,
					clusterCount: 2,
					op: "connect",
					firstShardID: 0,
					lastShardID: 4,
					shardCount: 5,
					token: "abc123",
					clientOptions: {},
					whatToLog: ["admiral_start"],
					useCentralRequestHandler: true,
					loadClusterCodeImmediately: false,
					resharding: true,
				},
			},
			{
				type: "service",
				workerID: 2,
				message: {
					serviceName: "example",
					op: "connect",
					timeout: 5000,
					whatToLog: ["admiral_start"],
				},
			},
		];

		queue.bulkItems(items);

		expect(queue.queue.length).toBe(2);
		expect(queue.queue).toEqual(items);
	});

	test("should execute the first item in the queue", () => {
		const item: QueueItem = {
			type: "cluster",
			workerID: 1,
			message: {
				clusterID: 1,
				clusterCount: 2,
				op: "connect",
				firstShardID: 0,
				lastShardID: 4,
				shardCount: 5,
				token: "abc123",
				clientOptions: {},
				whatToLog: ["admiral_start"],
				useCentralRequestHandler: true,
				loadClusterCodeImmediately: false,
				resharding: true,
			},
		};

		queue.item(item);
		queue.execute();

		expect(queue.queue.length).toBe(0);
	});

	test("should execute the next item after executing the first one", () => {
		const item1: QueueItem = {
			type: "cluster",
			workerID: 1,
			message: {
				clusterID: 1,
				clusterCount: 2,
				op: "connect",
				firstShardID: 0,
				lastShardID: 4,
				shardCount: 5,
				token: "abc123",
				clientOptions: {},
				whatToLog: ["admiral_start"],
				useCentralRequestHandler: true,
				loadClusterCodeImmediately: false,
				resharding: true,
			},
		};

		const item2: QueueItem = {
			type: "service",
			workerID: 2,
			message: {
				serviceName: "example",
				op: "connect",
				timeout: 5000,
				whatToLog: ["admiral_start"],
			},
		};

		queue.item(item1);
		queue.item(item2);
		queue.execute();
		queue.execute();

		expect(queue.queue.length).toBe(0);
	});

	test("should skip executing if override is set and not matching", () => {
		const item: QueueItem = {
			type: "service",
			workerID: 1,
			message: {
				serviceName: "example",
				op: "connect",
				timeout: 5000,
				whatToLog: ["admiral_start"],
			},
		};

		queue.override = "someKey";
		queue.item(item, "differentKey");
		queue.execute();

		expect(queue.queue.length).toBe(0);
	});

	test("should execute if override is set and matching", () => {
		const item: QueueItem = {
			type: "service",
			workerID: 1,
			message: {
				serviceName: "example",
				op: "connect",
				timeout: 5000,
				whatToLog: ["admiral_start"],
			},
		};

		queue.override = "someKey";
		queue.item(item, "someKey");
		queue.execute(undefined, "someKey");

		expect(queue.queue.length).toBe(0);
	});

	// Add more test cases as needed
});
