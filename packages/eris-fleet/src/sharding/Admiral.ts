import * as carrier from "wumpus-carrier";
import {Admiral} from "wumpus-carrier";
import * as Eris from "eris";
import nodeCluster, {Worker as NodeWorker} from "cluster";
import { AdaptedCluster } from "../clusters/Cluster";

export interface LibClientStatus {
	status: Eris.Status;
	activities?: Eris.ActivityPartial<Eris.BotActivityType>[];
}

/** See {@link wumpus-carrier!Admiral} for further documentation. */
export class AdaptedAdmiral extends carrier.Admiral<Eris.Client, typeof Eris.Client, Eris.ClientOptions, Eris.LatencyRef, LibClientStatus> {
	constructor(options: carrier.Options<typeof Eris.Client, Eris.ClientOptions, LibClientStatus, Eris.Client, Eris.LatencyRef>) {
		super(options);
		this.AdaptedCluster = AdaptedCluster;
		this.clientOptions = options.clientOptions ?? {intents: Eris.Constants.Intents.allNonPrivileged} satisfies Eris.ClientOptions;
		this.LibClient = options.customClient ?? Eris.Client;
		this.bot = new this.LibClient(this.token!);

		if (nodeCluster.isMaster) {
			nodeCluster.on("message", (worker, message) => {
				if (message.op) {
					switch (message.op) {
					case "centralApiRequest": {
						const data = carrier.Serialization.deserialize(message.request.dataSerialized);
						this.centralApiRequest(worker, message.request.UUID, data);
						break;
					}
					}
				}
			});
		}

		this.launch();
	}

	getCentralRequestHandlerLatencyRef() {
		return this.bot!.requestHandler.latencyRef;
	}
	async getBotGateway() {
		const gateway = await this.bot!.getBotGateway();
		return {
			shards: gateway.shards,
			sessionStartLimit: {
				maxConcurrency: gateway.session_start_limit.max_concurrency,
				remaining: gateway.session_start_limit.remaining,
				resetAfter: gateway.session_start_limit.reset_after,
				total: gateway.session_start_limit.total
			},
			url: gateway.url
		};
	}

	private centralApiRequest(worker: NodeWorker, UUID: string, data: {method: Eris.RequestMethod, url: string, auth?: boolean, body?: { [s: string]: unknown }, file?: Eris.FileContent, fileString?: string, _route?: string, short?: boolean}) {
		const reply = (resolved: boolean, value: unknown) => {
			const valueSerialized = carrier.Serialization.serialize(value);
			worker.send({
				op: "centralApiResponse",
				id: UUID,
				value: {
					resolved,
					valueSerialized
				}
			});
		};

		if (data.fileString && data.file) {
			data.file.file = Buffer.from(data.fileString, "base64");
		}

		this.bot!.requestHandler.request(data.method, data.url, data.auth, data.body, data.file, data._route, data.short)
			.then((value) => {
				reply(true, value);
			})
			.catch((error) => {
				const msg = {
					convertedErrorObject: false,
					error
				};
				if (error instanceof Error) {
					msg.error = carrier.Serialization.serialize(error);
					msg.convertedErrorObject = true;
				}
				reply(false, msg);
			});
	}
}