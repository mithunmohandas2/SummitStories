import { strict as assert } from "assert";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import manifest from "../../src/app/manifest";

test("install manifest declares standalone scope and correctly sized PNG icons", async () => {
  const app = manifest();
  assert.equal(app.name, "Summit Stories");
  assert.equal(app.display, "standalone");
  assert.equal(app.start_url, "/");
  assert.equal(app.scope, "/");
  assert.ok(app.icons?.some((icon) => icon.purpose === "maskable"));
  for (const icon of app.icons ?? []) {
    const bytes = await readFile(`public${icon.src}`);
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(
      `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`,
      icon.sizes,
    );
  }
});

test("service worker bypasses APIs, mutations and RSC responses and provides offline navigation fallback", async () => {
  type WorkerEvent = {
    request: { url: string; method: string; mode: string; headers: Headers };
    respondWith: (response: Promise<Response>) => void;
  };
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  let networkCalls = 0;
  runInNewContext(await readFile("public/sw.js", "utf8"), {
    self: {
      location: { origin: "https://summit.example" },
      addEventListener: (type: string, handler: (event: WorkerEvent) => void) =>
        listeners.set(type, handler),
    },
    caches: {
      match: async (path: string) => {
        assert.equal(path, "/offline.html");
        return new Response("Offline fallback");
      },
    },
    URL,
    Response,
    fetch: async () => {
      networkCalls += 1;
      throw new Error("offline");
    },
  });
  const intercept = (
    path: string,
    options?: { method?: string; mode?: string; headers?: Headers },
  ) => {
    let response: Promise<Response> | undefined;
    listeners.get("fetch")!({
      request: {
        url: `https://summit.example${path}`,
        method: options?.method ?? "GET",
        mode: options?.mode ?? "cors",
        headers: options?.headers ?? new Headers(),
      },
      respondWith: (value) => {
        response = value;
      },
    });
    return response;
  };
  assert.equal(intercept("/api/blogs"), undefined);
  assert.equal(intercept("/api/auth/session"), undefined);
  assert.equal(intercept("/api/images", { method: "POST" }), undefined);
  assert.equal(intercept("/api/blogs/story", { method: "DELETE" }), undefined);
  assert.equal(
    intercept("/blogs", { headers: new Headers({ RSC: "1" }) }),
    undefined,
  );
  assert.equal(networkCalls, 0);
  assert.equal(
    await (await intercept("/builder", { mode: "navigate" }))?.text(),
    "Offline fallback",
  );
  assert.equal(networkCalls, 1);
});
