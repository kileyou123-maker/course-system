import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../worker/runtime.mjs";
const handler = createHandler({
  "/index.html": {
    type: "text/html; charset=utf-8",
    content: "<main>Planner</main>",
  },
  "/assets/app.js": { type: "text/javascript", content: "export {}" },
});
test("serves bundled UI assets with correct content type and cache policy", async () => {
  const home = await handler.fetch(new Request("https://planner.example/"));
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Planner/);
  assert.equal(home.headers.get("cache-control"), "no-cache");
  assert.match(
    home.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  const js = await handler.fetch(
    new Request("https://planner.example/assets/app.js"),
  );
  assert.match(js.headers.get("cache-control"), /immutable/);
  assert.equal(
    (await handler.fetch(new Request("https://planner.example/missing")))
      .status,
    404,
  );
  assert.equal(
    (
      await handler.fetch(
        new Request("https://planner.example/", { method: "HEAD" }),
      )
    ).body,
    null,
  );
});
test("only proxies known API paths and allowed same-origin mutations", async () => {
  assert.equal(
    (await handler.fetch(new Request("https://planner.example/api/unknown")))
      .status,
    404,
  );
  assert.equal(
    (
      await handler.fetch(
        new Request("https://planner.example/api/auth/login", {
          method: "POST",
          headers: { origin: "https://evil.example" },
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await handler.fetch(
        new Request("https://planner.example/api/health", { method: "PATCH" }),
      )
    ).status,
    405,
  );
});
test("proxy uses fixed upstream, passes bearer authentication and never forwards cookies", async () => {
  const original = globalThis.fetch;
  let actual;
  globalThis.fetch = async (url, opts) => {
    actual = { url, opts };
    return new Response('{"items":[]}', {
      headers: { "content-type": "application/json" },
    });
  };
  try {
    const r = await handler.fetch(
      new Request("https://planner.example/api/courses?keyword=SAS", {
        headers: {
          authorization: "Bearer fixture-token",
          cookie: "private-cookie=value",
        },
      }),
    );
    assert.equal(r.status, 200);
    assert.equal(
      actual.url,
      "https://ntunhs-course-system-web.onrender.com/api/courses?keyword=SAS",
    );
    assert.equal(
      actual.opts.headers.get("authorization"),
      "Bearer fixture-token",
    );
    assert.equal(actual.opts.headers.get("cookie"), null);
    assert.equal(r.headers.get("cache-control"), "no-store");
  } finally {
    globalThis.fetch = original;
  }
});
test("upstream errors produce retryable JSON rather than a broken UI response", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw Error("offline");
  };
  try {
    const r = await handler.fetch(
      new Request("https://planner.example/api/courses"),
    );
    assert.equal(r.status, 502);
    assert.match((await r.json()).error, /temporarily unavailable/);
  } finally {
    globalThis.fetch = original;
  }
});
