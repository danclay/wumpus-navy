import * as carrier from "wumpus-carrier";
import * as Oceanic from "oceanic.js";
import { LibClientStatus } from "./sharding/Admiral";

// Apply generics
const Service = carrier.Service as typeof carrier.Service<Oceanic.LatencyRef>;
const IPC = carrier.IPC as typeof carrier.IPC<Oceanic.LatencyRef>;
const BaseClusterWorker = carrier.BaseClusterWorker as typeof carrier.BaseClusterWorker<Oceanic.Client, Oceanic.LatencyRef>;
const BaseServiceWorker = carrier.BaseServiceWorker as typeof carrier.BaseServiceWorker<Oceanic.LatencyRef>;
type Options = carrier.Options<typeof Oceanic.Client, Oceanic.ClientOptions, LibClientStatus, Oceanic.Client, Oceanic.LatencyRef>;
type Stats = carrier.Stats<Oceanic.LatencyRef>;
type ClusterStats = carrier.ClusterStats<Oceanic.LatencyRef>;

// Export methods without generics
export {Serialization, SoftKillNotification, ShardStats, ServiceStats, ObjectLog, ReshardOptions, LoggingOptions, ClusterCollection, ServiceCollection, ServiceCreator, ShardUpdate, CentralStore, Collection} from "wumpus-carrier";

// no more generics :)
export {Service, IPC, BaseClusterWorker, BaseServiceWorker, Options, Stats, ClusterStats};

// Export adapted classes
export {AdaptedAdmiral as Fleet} from "./sharding/Admiral";
export {AdaptedCluster as Cluster} from "./clusters/Cluster";