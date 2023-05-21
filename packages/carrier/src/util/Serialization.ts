import {serializeError, deserializeError} from "serialize-error";

export const serialize = (data: unknown): any => {
	return JSON.stringify(data, (key, value) => {
		switch(typeof value) {
		case "bigint": {
			return "BIGINT::" + value.toString();
		}
		case "undefined": {
			return "UNDEFINED::";
		}
		case "object": {
			if (value === null) return value;
		
			if (value instanceof Error) {
				return "ERROR::" + serializeError(value);
			} else if (value instanceof Map) {
				return "MAP::" + JSON.stringify(Array.from(value.entries()));
			} else if (Buffer.isBuffer(value)) {
				return "BUFFER::" + JSON.stringify(value);
			} else if ("type" in value) { // since Buffer.isBuffer was not working sometimes
				if (value.type === "Buffer") {
					return "BUFFER::" + JSON.stringify(value);
				}
			}
			return value;
		}
		default: {
			return value;
		}
		}
	});
};

export const deserialize = (s: string): any => {
	return JSON.parse(s, (key, value) => {
		if (typeof value === "string") {
			if (value.startsWith("BIGINT::")) {
				return BigInt(value.substring(8)); 
			} else if (value.startsWith("UNDEFINED::")) {
				return undefined;
			} else if (value.startsWith("ERROR::")) {
				return deserializeError(value.substring(7));
			} else if (value.startsWith("MAP::")) {
				return new Map(JSON.parse(value.substring(5)));
			} else if (value.startsWith("BUFFER::")) {
				return Buffer.from(JSON.parse(value.substring(8)));
			}
		}
		return value;
	});
};

// Unused for now
/*export const IPCSerializer = (data: unknown): string => {
	return "CEREAL::" + serialize(data); // fun label
};

export const IPCDeserializer = (input: unknown) => {
	if (typeof input === "string") {
		if (input.startsWith("CEREAL::")) {
			return deserialize(input.substring(9));
		}
	}
	return input;
};

export const IPCListen = (callback: (m: any) => void) => {
	return process.on("message", m => {
		callback(IPCDeserializer(m));
	});
};

export const IPCSend = (m: any) => {
	return process.send!(IPCSerializer(m));
};*/