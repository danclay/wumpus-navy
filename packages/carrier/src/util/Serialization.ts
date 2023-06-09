import {serializeError, deserializeError} from "serialize-error";

/**
 * Used internally for serialization by carrier.
 */
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
				return "ERROR::" + JSON.stringify(serializeError(value)); // since serialize-error leaves with json
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

/**
 * Used internally for deserialization by carrier.
 */
export const deserialize = (s: string): any => {
	return JSON.parse(s, (key, value) => {
		if (typeof value === "string") {
			if (value.startsWith("BIGINT::")) {
				return BigInt(value.substring("BIGINT::".length)); 
			} else if (value.startsWith("UNDEFINED::")) {
				return undefined;
			} else if (value.startsWith("ERROR::")) {
				return deserializeError(JSON.parse(value.substring("ERROR::".length)));
			} else if (value.startsWith("MAP::")) {
				return new Map(JSON.parse(value.substring("MAP::".length)));
			} else if (value.startsWith("BUFFER::")) {
				return Buffer.from(JSON.parse(value.substring("BUFFER::".length)));
			}
		}
		return value;
	});
};