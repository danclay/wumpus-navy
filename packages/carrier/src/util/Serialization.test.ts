import {describe, expect, test} from "@jest/globals";
import {serialize, deserialize} from "./Serialization";

// chatgpt written
describe("Serialization and deserialization", () => {
	test("should serialize and deserialize data correctly", () => {
		// Test data
		const data = {
			name: "John Doe",
			age: 30,
			errors: [
				new Error("Error 1"),
				new Error("Error 2")
			],
			buffer: Buffer.from("Hello, world!")
		};

		// Serialize the data
		const serializedData = serialize(data);

		// Deserialize the serialized data
		const deserializedData = deserialize(serializedData);

		// Check if deserialized data is equal to original data
		expect(deserializedData).toEqual(data);
	});

	test("should correctly serialize and deserialize special values", () => {
		// Test data
		const data = {
			bigintValue: BigInt(1234567890),
			undefinedValue: undefined,
			mapValue: new Map([
				["key1", "value1"],
				["key2", "value2"]
			]),
			bufferValue: Buffer.from("Hello, world!")
		};

		// Serialize the data
		const serializedData = serialize(data);

		// Deserialize the serialized data
		const deserializedData = deserialize(serializedData);

		// Check if deserialized data is equal to original data
		expect(deserializedData).toEqual(data);
	});
});