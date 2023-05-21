import {describe, expect, test, beforeEach, afterEach} from "@jest/globals";
import { Collection } from "./Collection";

// chatgpt written
describe("Collection", () => {
	let collection: Collection<string, number>;

	beforeEach(() => {
		collection = new Collection<string, number>();
		collection.set("one", 1);
		collection.set("two", 2);
		collection.set("three", 3);
	});

	afterEach(() => {
		collection.clear();
	});

	test("find() returns the value matching the condition", () => {
		const result = collection.find((item) => item === 2);
		expect(result).toBe(2);
	});

	test("find() returns undefined when no match is found", () => {
		const result = collection.find((item) => item === 4);
		expect(result).toBeUndefined();
	});
});
