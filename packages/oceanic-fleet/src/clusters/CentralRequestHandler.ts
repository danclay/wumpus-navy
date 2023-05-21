import crypto from "crypto";
//import RequestHandler from "oceanic.js/dist/lib/rest/RequestHandler";
import { RequestOptions, RESTManager, RequestHandlerInstanceOptions } from "oceanic.js";
import { Serialization } from "wumpus-carrier";

/*interface FileSerialized extends Omit<File, "contents"> {
	contents: string;
}

export interface RequestDataSerialized extends Omit<RequestOptions, "files"> {
	files: FileSerialized[]
}*/

export interface CentralRequestHandlerCB {
	resolved: boolean
	serializedValue: string;
}

export interface CentralApiReq {
	op: "centralApiRequest";
	request: {
		UUID: string;
		serializedData: string;
	};
}

export interface CentralApiRes {
	op: "centralApiResponse"
	id: string
	value: CentralRequestHandlerCB
}

export class CentralRequestHandler /*extends RequestHandler*/ { // since RequestHandler is not exported by Oceanic
	private requests: Map<string, (r: CentralRequestHandlerCB) => void>;
	//private manager: RESTManager; // Workaround since RequestHandler is not exported by Oceanic
	private options: RequestHandlerInstanceOptions; // Workaround since RequestHandler is not exported by Oceanic

	constructor(manager: RESTManager/*, options: RESTOptions = {}*/) {
		this.requests = new Map();

		// Workaround since RequestHandler is not exported by Oceanic
		//super(manager, options);
		this.options = manager.handler.options;
		// end workaround

		process.on("message", (message: any) => {
			if (message.op === "centralApiResponse") {
				const reqMsg = message as CentralApiRes;
				const request = this.requests.get(reqMsg.id);
				if (request) {
					request(reqMsg.value);
				}
			}
		});
	}

	public request<T = unknown>(options: RequestOptions): Promise<T> {
		const UUID = crypto.randomUUID();

		const serializedData = Serialization.serialize(options);
		process.send!({op: "centralApiRequest", request: {UUID, serializedData}} satisfies CentralApiReq);

		return new Promise((resolve, reject) => {
			// timeout
			const timeout = setTimeout(() => {
				this.requests.delete(UUID);
				reject(new Error(`Request Timed Out (>${this.options.requestTimeout}ms) on ${options.method} ${options.path}`));
			}, this.options.requestTimeout);

			const callback = (r: CentralRequestHandlerCB) => {
				const resVal = Serialization.deserialize(r.serializedValue);
				this.requests.delete(UUID);
				clearTimeout(timeout);
				if (r.resolved) {
					resolve(resVal as T);
				} else {
					reject(resVal);
				}
			};

			this.requests.set(UUID, callback);
		});
	}
}