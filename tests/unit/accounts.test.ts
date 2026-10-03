import { strict as assert } from "assert";
import { test } from "node:test";
import {
  authenticateAccount,
  authConfigured,
  configuredAccounts,
} from "../../src/lib/accounts";

test("credentials come from the environment and only safe identity fields are returned", () => {
  const previous = process.env.BLOG_USERS;
  const secret = process.env.NEXTAUTH_SECRET;
  try {
    process.env.BLOG_USERS = JSON.stringify([
      {
        username: "writer",
        password: "long-test-password",
        name: "Writer Name",
      },
    ]);
    process.env.NEXTAUTH_SECRET = "test-secret";
    assert.equal(authConfigured(), true);
    assert.deepEqual(authenticateAccount("writer", "long-test-password"), {
      id: "writer",
      name: "Writer Name",
    });
    assert.equal(authenticateAccount("writer", "wrong"), null);
    assert.equal(authenticateAccount("WRITER", "long-test-password"), null);
    assert.equal(authenticateAccount(" writer", "long-test-password"), null);
    assert.equal(authenticateAccount("writer ", "long-test-password"), null);
    assert.equal(authenticateAccount("writer", "long-test-password "), null);
    assert.equal(authenticateAccount("missing", "long-test-password"), null);
    assert.equal(
      authenticateAccount({ username: "writer" }, "long-test-password"),
      null,
    );
    delete process.env.NEXTAUTH_SECRET;
    assert.equal(authConfigured(), false);
    process.env.BLOG_USERS = "not-json";
    assert.deepEqual(configuredAccounts(), []);
    process.env.BLOG_USERS = JSON.stringify([
      { username: "writer", password: "short", name: "Writer" },
    ]);
    assert.deepEqual(authenticateAccount("writer", "short"), {
      id: "writer",
      name: "Writer",
    });
    process.env.BLOG_USERS = JSON.stringify([
      { username: "writer", password: "one" },
      { username: "writer", password: "two", name: "Second Writer" },
      { username: " writer ", password: " spaced " },
    ]);
    assert.deepEqual(authenticateAccount("writer", "one"), {
      id: "writer",
      name: "writer",
    });
    assert.deepEqual(authenticateAccount("writer", "two"), {
      id: "writer",
      name: "Second Writer",
    });
    assert.deepEqual(authenticateAccount(" writer ", " spaced "), {
      id: " writer ",
      name: " writer ",
    });
    assert.equal(authenticateAccount("writer", "spaced"), null);
  } finally {
    if (previous === undefined) delete process.env.BLOG_USERS;
    else process.env.BLOG_USERS = previous;
    if (secret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = secret;
  }
});
