import * as carrier from "wumpus-carrier";
import * as Oceanic from "oceanic.js";
import nodeCluster, {Worker as NodeWorker} from "cluster";
import { AdaptedCluster } from "../clusters/Cluster";
import { CentralApiReq, CentralApiRes } from "../clusters/CentralRequestHandler";

export interface LibClientStatus {
	status: Oceanic.SendStatuses;
	activities?: Oceanic.BotActivity[];
}

/**
 * ***See {@link wumpus-carrier!Admiral} for full documentation.***
 * @noInheritDoc
 */
export class AdaptedAdmiral extends carrier.Admiral<Oceanic.Client, typeof Oceanic.Client, Oceanic.ClientOptions, Oceanic.LatencyRef, LibClientStatus> {
	constructor(options: carrier.Options<typeof Oceanic.Client, Oceanic.ClientOptions, LibClientStatus, Oceanic.Client, Oceanic.LatencyRef>) {
		super(options);
		this.AdaptedCluster = AdaptedCluster;
		this.clientOptions = options.clientOptions ?? {gateway: {intents: Oceanic.Constants.AllNonPrivilegedIntents}} satisfies Oceanic.ClientOptions;
		this.LibClient = options.customClient ?? Oceanic.Client;

		// add token to client options
		if (!this.clientOptions.auth) {
			this.clientOptions.auth = this.token;
		}

		if (nodeCluster.isMaster) {
			nodeCluster.on("message", (worker, message) => {
				if (message.op) {
					switch (message.op) {
					case "centralApiRequest": {
						const reqMsg = message as CentralApiReq;
						console.log(reqMsg);
						const data = carrier.Serialization.deserialize(reqMsg.request.serializedData) as Oceanic.RequestOptions;
						this.centralApiRequest(worker, reqMsg.request.UUID, data);
						break;
					}
					}
				}
			});
		}

		// create bot last with client option modifications
		this.bot = new this.LibClient(this.clientOptions);

		this.launch();
	}

	/** @internal */
	getCentralRequestHandlerLatencyRef() {
		return this.bot!.rest.handler.latencyRef;
	}

	/** @internal */
	async getBotGateway() {
		const gateway = await this.bot!.rest.getBotGateway();
		return gateway;
	}

	/** @internal */
	private centralApiRequest(worker: NodeWorker, UUID: string, data: Oceanic.RequestOptions) {
		const reply = (resolved: boolean, value: unknown) => {
			worker.send({
				op: "centralApiResponse",
				id: UUID,
				value: {
					resolved,
					serializedValue: carrier.Serialization.serialize(value)
				}
			} satisfies CentralApiRes);
		};

		this.bot!.rest.request(data)
			.then((value) => {
				reply(true, value);
			})
			.catch((error) => {
				reply(false, error);
			});
	}
}