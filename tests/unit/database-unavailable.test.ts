import { strict as assert } from "assert";
import { test } from "node:test";
import { getMongoClient } from "../../src/lib/mongodb";
import { DatabaseUnavailableError, databaseUnavailableResponse } from "../../src/lib/database-errors";

test("missing database configuration produces a safe 503 response", async () => {
  const previous = process.env.MONGODB_URI;
  try {
    delete process.env.MONGODB_URI;
    assert.throws(() => getMongoClient(), error => error instanceof DatabaseUnavailableError && error.message === "Database unavailable");
    const response = databaseUnavailableResponse();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), { error: "Database unavailable" });
  } finally {
    if (previous === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previous;
  }
});
