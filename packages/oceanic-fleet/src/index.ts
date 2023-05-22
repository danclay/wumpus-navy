import * as carrier from "wumpus-carrier";
import * as Oceanic from "oceanic.js";
import { LibClientStatus } from "./sharding/Admiral";

// Export methods without generics
export {Serialization, SoftKillNotification, ShardStats, ServiceStats, ObjectLog, ReshardOptions, LoggingOptions, ClusterCollection, ServiceCollection, ServiceCreator, ShardUpdate, CentralStore, Collection} from "wumpus-carrier";

// Type onlys
/** See {@link wumpus-carrier!Options} for further documentation. */
export type Options = carrier.Options<typeof Oceanic.Client, Oceanic.ClientOptions, LibClientStatus, Oceanic.Client, Oceanic.LatencyRef>;
/** See {@link wumpus-carrier!Stats} for further documentation. */
export type Stats = carrier.Stats<Oceanic.LatencyRef>;
/** See {@link wumpus-carrier!ClusterStats} for further documentation. */
export type ClusterStats = carrier.ClusterStats<Oceanic.LatencyRef>;

// Export adapted classes
/** See {@link wumpus-carrier!Admiral} for further documentation. */
export {AdaptedAdmiral as Fleet} from "./sharding/Admiral";
/** See {@link wumpus-carrier!BaseClusterWorker} for further documentation. */
export class BaseClusterWorker extends carrier.BaseClusterWorker<Oceanic.Client, Oceanic.LatencyRef> {
	constructor(setup: carrier.BaseClusterWorkerSetup<Oceanic.Client, Oceanic.LatencyRef>) {
		super(setup);
	}
}
/** See {@link wumpus-carrier!BaseServiceWorker} for further documentation. */
export class BaseServiceWorker extends carrier.BaseServiceWorker<Oceanic.LatencyRef> {
	constructor(setup: carrier.BaseServiceWorkerSetup<Oceanic.LatencyRef>) {
		super(setup);
	}
}
/** See {@link wumpus-carrier!IPC} for further documentation. */
export class IPC extends carrier.IPC<Oceanic.LatencyRef> {
}