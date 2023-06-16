import * as carrier from "wumpus-carrier";
import * as Oceanic from "oceanic.js";
import { LibClientStatus } from "./sharding/Admiral";

// Export methods without generics
export {Serialization, SoftKillNotification, ShardStats, ServiceStats, ObjectLog, ReshardOptions, LoggingOptions, ClusterCollection, ServiceCollection, ServiceCreator, ShardUpdate, CentralStore, Collection, BaseClusterWorkerSetup, BaseServiceWorkerSetup} from "wumpus-carrier";

// Add types
/** 
 * ***See {@link wumpus-carrier!Options} for full documentation.***
 * @noInheritDoc
*/
export interface Options extends carrier.Options<typeof Oceanic.Client, Oceanic.ClientOptions, LibClientStatus, Oceanic.Client, Oceanic.LatencyRef> {
}

/** 
 * ***See {@link wumpus-carrier!Stats} for full documentation.***
 * @noInheritDoc
 */
export interface Stats extends carrier.Stats<Oceanic.LatencyRef> {
}

/** 
 * ***See {@link wumpus-carrier!ClusterStats} for full documentation.***
 * @noInheritDoc
 */
export interface ClusterStats extends carrier.ClusterStats<Oceanic.LatencyRef> {
}

// Export adapted classes
export {AdaptedAdmiral as Fleet} from "./sharding/Admiral";

/** 
 * ***See {@link wumpus-carrier!BaseClusterWorker} for full documentation.***
 * @noInheritDoc
*/
export class BaseClusterWorker extends carrier.BaseClusterWorker<Oceanic.Client, Oceanic.LatencyRef> {
	constructor(setup: carrier.BaseClusterWorkerSetup<Oceanic.Client, Oceanic.LatencyRef>) {
		super(setup);
	}
}

/** 
 * ***See {@link wumpus-carrier!BaseServiceWorker} for full documentation.***
 * @noInheritDoc
 */
export class BaseServiceWorker extends carrier.BaseServiceWorker<Oceanic.LatencyRef> {
	constructor(setup: carrier.BaseServiceWorkerSetup<Oceanic.LatencyRef>) {
		super(setup);
	}
}

/** 
 * ***See {@link wumpus-carrier!IPC} for full documentation.***
 * @noInheritDoc
 */
export class IPC extends carrier.IPC<Oceanic.LatencyRef> {
}