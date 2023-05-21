import { Serialization } from "wumpus-carrier";
import * as Eris from "eris";

interface CentralRequestHandlerOptions {
	timeout: number;
}

export class CentralRequestHandler {
	private timeout: number;
	private requests: Map<string, (r: {resolved: boolean, value: unknown}) => void>;

	constructor(options: CentralRequestHandlerOptions) {
		this.timeout = options.timeout;
		this.requests = new Map();

		process.on("message", (message: any) => {
			if (message.op === "centralApiResponse") {
				const request = this.requests.get(message.id);
				if (request) {
					message.value.value = Serialization.deserialize(message.value.valueSerialized);
					request(message.value);
				}
			}
		});
	}

	public request(method: Eris.RequestMethod, url: string, auth?: boolean, body?: { [s: string]: unknown }, file?: Eris.FileContent, _route?: string, short?: boolean): Promise<unknown> {
		const UUID = crypto.randomUUID();

		let fileString;
		if (file) {
			if (file.file) {
				fileString = Buffer.from(file.file).toString("base64");
				file.file = "";
			}
		}
		const data = {method, url, auth, body, file, fileString, _route, short};
		const dataSerialized = Serialization.serialize(data);

		if (process.send) process.send({op: "centralApiRequest", request: {UUID, dataSerialized}});

		return new Promise((resolve, reject) => {
			// timeout
			const timeout = setTimeout(() => {
				this.requests.delete(UUID);
				reject(`Request timed out (>${this.timeout}ms)`);
			}, this.timeout);

			const callback = (r: {resolved: boolean, value: unknown}) => {
				this.requests.delete(UUID);
				clearTimeout(timeout);
				if (r.resolved) {
					resolve(r.value);
				} else {
					const value = r.value as {convertedErrorObject: boolean, error: unknown};
					if (value.convertedErrorObject) {
						reject(Serialization.deserialize(value.error as string));
					} else {
						reject(value.error);
					}
				}
			};

			this.requests.set(UUID, callback);
		});
	}
}