import {EventEmitter} from "events";
import {LoggingOptions} from "../sharding/Admiral";

/** @internal */
export interface ClusterConnectMessage<LibClientOptions = unknown, LibClientStatus = unknown> {
	clusterID: number;
	clusterCount: number;
	op: "connect" | string;
	firstShardID: number;
	lastShardID: number;
	shardCount: number;
	token: string;
	clientOptions: LibClientOptions;
	path?: string;
	whatToLog: LoggingOptions[];
	startingStatus?: LibClientStatus;
	useCentralRequestHandler: boolean;
	loadClusterCodeImmediately: boolean;
	resharding: boolean;
}

/** @internal */
export interface ShutdownMessage {
	op: "shutdown" | string;
}

/** @internal */
export interface ServiceConnectMessage {
	serviceName: string;
	path?: string;
	op: "connect" | string;
	timeout: number;
	whatToLog: LoggingOptions[];
}

/** @internal */
export interface QueueItem {
	type: "service" | "cluster" | string;
	workerID: number;
	message: ClusterConnectMessage | ServiceConnectMessage | ShutdownMessage;
}

/** @internal */
export class Queue extends EventEmitter {
	/** The queue */
	public queue: QueueItem[];
	/** Pauses all non-authorized executions */
	public override: string | undefined;

	public constructor() {
		super();
		this.queue = [];
	}

	public execute(first?: boolean, override?: string): void {
		if (this.override && override !== this.override) return;
		const prevItem = first ? undefined : this.queue[0];
		if (!first) this.queue.splice(0, 1);
		const item = this.queue[0];
		if (!item) return;
		this.emit("execute", item, prevItem);
	}

	public item(item: QueueItem, override?: string): void {
		if (this.override && override !== this.override) return;
		this.queue.push(item);
		if (this.queue.length === 1) this.execute(true, override);
	}

	public bulkItems(items: QueueItem[], override?: string): void {
		if (this.override && override !== this.override) return;
		const execute = this.queue.length === 0;
		this.queue = this.queue.concat(items);
		if (execute) this.execute(true, override);
	}
}