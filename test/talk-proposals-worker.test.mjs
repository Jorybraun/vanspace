import assert from "node:assert/strict";
import { describe, test } from "node:test";

import worker from "../worker/talk-proposals-worker.js";

describe("talk proposal Worker route", () => {
  test("returns 404 outside the proposal API route", async () => {
    const response = await worker.fetch(
      new Request("https://biossphere.dev/not-the-api"),
      {},
      executionContext(),
    );

    assert.equal(response.status, 404);
    assert.equal(await response.text(), "Not found");
  });

  test("adapts the Worker runtime to the proposal handler", async () => {
    const response = await worker.fetch(
      new Request("https://biossphere.dev/api/talk-proposals"),
      {
        PROPOSALS_DB: { prepare() {} },
        TURNSTILE_SITE_KEY: "public-site-key",
        TURNSTILE_SECRET_KEY: "private-secret-key",
      },
      executionContext(),
    );

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.equal(body.config.turnstile.siteKey, "public-site-key");
  });
});

function executionContext() {
  return {
    waitUntil() {},
  };
}
