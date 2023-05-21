import * as carrier from "wumpus-carrier";
import * as Eris from "eris";
import { LibClientStatus } from "./sharding/Admiral";

// Apply generics
const Service = carrier.Service as typeof carrier.Service<Eris.LatencyRef>;
const IPC = carrier.IPC as typeof carrier.IPC<Eris.LatencyRef>;
const BaseClusterWorker = carrier.BaseClusterWorker as typeof carrier.BaseClusterWorker<Eris.Client, Eris.LatencyRef>;
const BaseServiceWorker = carrier.BaseServiceWorker as typeof carrier.BaseServiceWorker<Eris.LatencyRef>;
type Options = carrier.Options<typeof Eris.Client, Eris.ClientOptions, LibClientStatus, Eris.Client, Eris.LatencyRef>;
type Stats = carrier.Stats<Eris.LatencyRef>;
type ClusterStats = carrier.ClusterStats<Eris.LatencyRef>;

// Export methods without generics
export {SoftKillNotification, ShardStats, ServiceStats, ObjectLog, ReshardOptions, LoggingOptions, ClusterCollection, ServiceCollection, ServiceCreator, ShardUpdate, CentralStore, Collection} from "wumpus-carrier";

// no more generics :)
export {Service, IPC, BaseClusterWorker, BaseServiceWorker, Options, Stats, ClusterStats};

// Export adapted classes
export {AdaptedAdmiral as Fleet} from "./sharding/Admiral";
export {AdaptedCluster as Cluster} from "./clusters/Cluster";