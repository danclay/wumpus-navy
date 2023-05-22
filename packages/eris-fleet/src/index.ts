import * as carrier from "wumpus-carrier";
import * as Eris from "eris";
import { LibClientStatus } from "./sharding/Admiral";

// Export methods without generics
export {Serialization, SoftKillNotification, ShardStats, ServiceStats, ObjectLog, ReshardOptions, LoggingOptions, ClusterCollection, ServiceCollection, ServiceCreator, ShardUpdate, CentralStore, Collection} from "wumpus-carrier";

// Type onlys
/** See {@link wumpus-carrier!Options} for further documentation. */
export type Options = carrier.Options<typeof Eris.Client, Eris.ClientOptions, LibClientStatus, Eris.Client, Eris.LatencyRef>;
/** See {@link wumpus-carrier!Stats} for further documentation. */
export type Stats = carrier.Stats<Eris.LatencyRef>;
/** See {@link wumpus-carrier!ClusterStats} for further documentation. */
export type ClusterStats = carrier.ClusterStats<Eris.LatencyRef>;

// Export adapted classes
/** See {@link wumpus-carrier!Admiral} for further documentation. */
export {AdaptedAdmiral as Fleet} from "./sharding/Admiral";
/** See {@link wumpus-carrier!BaseClusterWorker} for further documentation. */
export class BaseClusterWorker extends carrier.BaseClusterWorker<Eris.Client, Eris.LatencyRef> {
	constructor(setup: carrier.BaseClusterWorkerSetup<Eris.Client, Eris.LatencyRef>) {
		super(setup);
	}
}
/** See {@link wumpus-carrier!BaseServiceWorker} for further documentation. */
export class BaseServiceWorker extends carrier.BaseServiceWorker<Eris.LatencyRef> {
	constructor(setup: carrier.BaseServiceWorkerSetup<Eris.LatencyRef>) {
		super(setup);
	}
}
/** See {@link wumpus-carrier!IPC} for further documentation. */
export class IPC extends carrier.IPC<Eris.LatencyRef> {
}