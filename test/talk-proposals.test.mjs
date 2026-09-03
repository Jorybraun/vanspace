import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { onRequest } from "../functions/api/talk-proposals.js";

const ENDPOINT = "https://biossphere.test/api/talk-proposals";
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

describe("talk proposal request handler", { concurrency: false }, () => {
  test("GET returns public configuration without leaking the secret", async () => {
    const database = createD1();
    const response = await onRequest(
      createContext({
        request: new Request(ENDPOINT),
        env: createEnv({ database }),
      }),
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.deepEqual(body.config.turnstile, {
      siteKey: "public-site-key",
      action: "talk_proposal",
    });
    assert.equal(body.config.fieldLimits.links.maxItems, 2);
    assert.equal(body.config.fieldLimits.workingTitle.max, 120);
    assert.equal(body.config.fieldLimits.takeaway.max, 240);
    assert.equal(body.config.fieldLimits.abstract.max, 1_800);
    assert.equal(body.config.recordingPreferenceIsRelease, false);
    assert.equal(body.config.notificationsEnabled, false);
    assert.ok(!body.config.optionalFields.includes("accessibilityTravel"));
    assert.ok(!JSON.stringify(body).includes("private-secret-key"));
    assert.equal(database.calls.length, 0);
  });

  test("GET fails closed when required bindings are missing", async () => {
    const response = await onRequest(
      createContext({
        request: new Request(ENDPOINT),
        env: { TURNSTILE_SITE_KEY: "public-site-key" },
      }),
    );

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Talk proposal submissions are temporarily unavailable.",
      },
    });
  });

  test("unsupported methods return a stable 405 response", async () => {
    const response = await onRequest(
      createContext({ request: new Request(ENDPOINT, { method: "PUT" }) }),
    );

    assert.equal(response.status, 405);
    assert.equal(response.headers.get("Allow"), "GET, POST");
    assert.equal((await response.json()).error.code, "METHOD_NOT_ALLOWED");
  });

  test("validation rejects inaccessible extra data and never calls Turnstile", async (t) => {
    const database = createD1();
    let fetchCalls = 0;
    stubFetch(t, async () => {
      fetchCalls += 1;
      throw new Error("fetch should not be called");
    });
    const input = validProposal();
    input.accessibilityTravel = "I need travel support.";

    const response = await submitJson(input, createEnv({ database }));

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Check the highlighted fields and try again.",
        fields: { _form: "unknown_fields" },
      },
    });
    assert.equal(fetchCalls, 0);
    assert.equal(database.calls.length, 0);
  });

  test("validation allows at most two links", async (t) => {
    const database = createD1();
    stubFetch(t, async () => {
      throw new Error("fetch should not be called");
    });
    const input = validProposal();
    input.links = [
      "https://example.com/one",
      "https://example.com/two",
      "https://example.com/three",
    ];

    const response = await submitJson(input, createEnv({ database }));

    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.equal(body.error.fields.links, "too_many");
    assert.equal(database.calls.length, 0);
  });

  test("validation rejects malformed ASCII email dot-atoms", async (t) => {
    const database = createD1();
    stubFetch(t, async () => {
      throw new Error("fetch should not be called");
    });

    for (const email of [
      ".speaker@example.com",
      "speaker.@example.com",
      "speaker..name@example.com",
      "speaKer@example.com",
    ]) {
      const input = validProposal();
      input.email = email;
      const response = await submitJson(input, createEnv({ database }));
      assert.equal(response.status, 400, email);
      assert.equal((await response.json()).error.fields.email, "invalid_format");
    }

    assert.equal(database.calls.length, 0);
  });

  test("validation counts Unicode code points consistently with D1", async (t) => {
    const database = createD1();
    stubFetch(t, async () => {
      throw new Error("fetch should not be called");
    });
    const input = validProposal();
    input.workingTitle = "🧪🧪🧪";

    const response = await submitJson(input, createEnv({ database }));

    assert.equal(response.status, 400);
    assert.equal(
      (await response.json()).error.fields.workingTitle,
      "too_short",
    );
    assert.equal(database.calls.length, 0);
  });

  test("honeypot and minimum-completion checks reject before Turnstile", async (t) => {
    const database = createD1();
    let fetchCalls = 0;
    stubFetch(t, async () => {
      fetchCalls += 1;
      throw new Error("fetch should not be called");
    });
    const honeypotInput = validProposal();
    honeypotInput.website = "https://spam.example";
    const fastInput = validProposal();
    fastInput.startedAt = Date.now();

    const honeypotResponse = await submitJson(
      honeypotInput,
      createEnv({ database }),
    );
    const fastResponse = await submitJson(fastInput, createEnv({ database }));

    assert.equal(honeypotResponse.status, 400);
    assert.equal(
      (await honeypotResponse.json()).error.code,
      "INVALID_SUBMISSION",
    );
    assert.equal(fastResponse.status, 400);
    assert.equal((await fastResponse.json()).error.fields.startedAt, "too_fast");
    assert.equal(fetchCalls, 0);
    assert.equal(database.calls.length, 0);
  });

  test("rejects requests without an exact same-origin Origin header", async (t) => {
    const database = createD1();
    stubFetch(t, async () => {
      throw new Error("fetch should not be called");
    });
    const request = new Request(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://attacker.test",
      },
      body: JSON.stringify(validProposal()),
    });

    const response = await onRequest(
      createContext({ request, env: createEnv({ database }) }),
    );

    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, "ORIGIN_NOT_ALLOWED");
    assert.equal(database.calls.length, 0);
  });

  test("Turnstile rejection does not write a proposal", async (t) => {
    const database = createD1();
    let verificationBody;
    stubFetch(t, async (url, init) => {
      assert.equal(url, TURNSTILE_VERIFY_URL);
      assert.equal(init.method, "POST");
      verificationBody = JSON.parse(init.body);
      return Response.json({
        success: true,
        action: "talk_proposal",
        hostname: "attacker.test",
      });
    });

    const response = await submitJson(
      validProposal(),
      createEnv({ database }),
    );

    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, "VERIFICATION_FAILED");
    assert.equal(verificationBody.secret, "private-secret-key");
    assert.equal(verificationBody.response, "turnstile-token");
    assert.match(verificationBody.idempotency_key, UUID_PATTERN);
    assert.equal(database.calls.length, 0);
  });

  test("Turnstile service and secret errors return 503", async (t) => {
    const database = createD1();
    stubFetch(t, async () =>
      Response.json({
        success: false,
        "error-codes": ["invalid-input-secret"],
      }),
    );

    const response = await submitJson(
      validProposal(),
      createEnv({ database }),
    );

    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, "VERIFICATION_UNAVAILABLE");
    assert.equal(database.calls.length, 0);
  });

  test("successful URL-encoded submission is normalized and stored", async (t) => {
    const database = createD1();
    stubSuccessfulTurnstile(t);
    const input = validProposal();
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(input)) {
      form.set(key, key === "links" ? value.join("\n") : String(value));
    }
    const request = new Request(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: new URL(ENDPOINT).origin,
        "User-Agent": "must-not-be-stored",
      },
      body: form,
    });

    const response = await onRequest(
      createContext({ request, env: createEnv({ database }) }),
    );

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.match(body.proposal.id, UUID_PATTERN);
    assert.ok(!Number.isNaN(Date.parse(body.proposal.submittedAt)));

    const select = database.calls.find((call) => call.sql.includes("SELECT COUNT"));
    const insert = database.calls.find((call) => call.sql.includes("INSERT INTO"));
    assert.ok(select);
    assert.ok(insert);
    assert.equal(select.values[0], "ada@example.com");
    assert.equal(insert.values.length, 16);
    assert.equal(insert.values[0], body.proposal.id);
    assert.equal(insert.values[2], "Ada Lovelace");
    assert.equal(insert.values[3], "Ada@Example.com");
    assert.equal(insert.values[4], "ada@example.com");
    assert.deepEqual(JSON.parse(insert.values[11]), input.links);
    assert.match(insert.values[15], /^[a-f0-9]{64}$/u);
    assert.ok(!insert.values.includes("turnstile-token"));
    assert.ok(!insert.values.includes("must-not-be-stored"));
    assert.ok(!insert.sql.toLowerCase().includes("user_agent"));
    assert.ok(!insert.sql.toLowerCase().includes("ip_address"));
  });

  test("successful multipart FormData submission is stored", async (t) => {
    const database = createD1();
    stubSuccessfulTurnstile(t);
    const input = validProposal();
    const form = new FormData();
    for (const [key, value] of Object.entries(input)) {
      form.set(key, key === "links" ? value.join("\n") : String(value));
    }
    const request = new Request(ENDPOINT, {
      method: "POST",
      headers: { Origin: new URL(ENDPOINT).origin },
      body: form,
    });

    const response = await onRequest(
      createContext({ request, env: createEnv({ database }) }),
    );

    assert.equal(response.status, 201);
    assert.equal((await response.json()).ok, true);
    const insert = database.calls.find((call) => call.sql.includes("INSERT INTO"));
    assert.ok(insert);
    assert.deepEqual(JSON.parse(insert.values[11]), input.links);
  });

  test("streamlined defaults work without optional location or links", async (t) => {
    const database = createD1();
    stubSuccessfulTurnstile(t);
    const input = validProposal();
    delete input.cityRegion;
    delete input.links;

    const response = await submitJson(input, createEnv({ database }));

    assert.equal(response.status, 201);
    const insert = database.calls.find((call) => call.sql.includes("INSERT INTO"));
    assert.ok(insert);
    assert.equal(insert.values[5], null);
    assert.equal(insert.values[7], "open");
    assert.equal(insert.values[11], "[]");
    assert.equal(insert.values[12], "discuss");
  });

  test("equivalent normalized proposals produce the same content hash", async (t) => {
    const firstDatabase = createD1();
    const secondDatabase = createD1();
    stubSuccessfulTurnstile(t);
    const first = validProposal();
    const second = validProposal();
    second.name = "  Ada Lovelace  ";
    second.email = "ADA@EXAMPLE.COM";

    assert.equal(
      (await submitJson(first, createEnv({ database: firstDatabase }))).status,
      201,
    );
    assert.equal(
      (await submitJson(second, createEnv({ database: secondDatabase }))).status,
      201,
    );

    const firstInsert = firstDatabase.calls.find((call) =>
      call.sql.includes("INSERT INTO"),
    );
    const secondInsert = secondDatabase.calls.find((call) =>
      call.sql.includes("INSERT INTO"),
    );
    assert.equal(firstInsert.values[15], secondInsert.values[15]);
  });

  test("rejects a body larger than the bounded limit with 413", async (t) => {
    const database = createD1();
    let fetchCalls = 0;
    stubFetch(t, async () => {
      fetchCalls += 1;
      throw new Error("fetch should not be called");
    });
    const request = new Request(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(ENDPOINT).origin,
      },
      body: "x".repeat(64 * 1_024 + 1),
    });

    const response = await onRequest(
      createContext({ request, env: createEnv({ database }) }),
    );

    assert.equal(response.status, 413);
    assert.equal((await response.json()).error.code, "PAYLOAD_TOO_LARGE");
    assert.equal(fetchCalls, 0);
    assert.equal(database.calls.length, 0);
  });

  test("a storage failure returns 503 and does not notify", async (t) => {
    const database = createD1({ insertResult: { success: false } });
    const notifications = createEmailBinding();
    const errors = silenceOperationalLogs(t);
    stubSuccessfulTurnstile(t);
    const { context, waits } = contextForSubmission({
      env: createEnv({ database, notifications }),
    });

    const response = await onRequest(context);

    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, "STORAGE_UNAVAILABLE");
    assert.equal(notifications.messages.length, 0);
    assert.equal(waits.length, 0);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /talk_proposal_storage_failed/u);
    assert.ok(!errors[0].includes("Ada"));
  });

  test("a duplicate content hash returns a stable 409", async (t) => {
    const database = createD1({
      insertError: new Error(
        "D1_ERROR: UNIQUE constraint failed: talk_proposals.content_hash",
      ),
    });
    stubSuccessfulTurnstile(t);

    const response = await submitJson(
      validProposal(),
      createEnv({ database }),
    );

    assert.equal(response.status, 409);
    assert.equal((await response.json()).error.code, "DUPLICATE_PROPOSAL");
  });

  test("the short-window per-email limit returns 429 before insertion", async (t) => {
    const database = createD1({ recentCount: 5 });
    stubSuccessfulTurnstile(t);

    const response = await submitJson(
      validProposal(),
      createEnv({ database }),
    );

    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Retry-After"), "3600");
    assert.equal((await response.json()).error.code, "SUBMISSION_LIMIT_REACHED");
    assert.ok(!database.calls.some((call) => call.sql.includes("INSERT INTO")));
  });

  test("notification runs after storage and contains only routing metadata", async (t) => {
    const sequence = [];
    const database = createD1({ sequence });
    const notifications = createEmailBinding({ sequence });
    stubSuccessfulTurnstile(t);
    const { context, waits } = contextForSubmission({
      env: createEnv({ database, notifications }),
    });

    const response = await onRequest(context);
    assert.equal(response.status, 201);
    const body = await response.json();
    await Promise.all(waits);

    assert.deepEqual(sequence, ["insert", "email"]);
    assert.equal(notifications.messages.length, 1);
    const message = notifications.messages[0];
    assert.equal(message.to, "hello@vanspace.dev");
    assert.deepEqual(message.from, {
      email: "proposals@vanspace.dev",
      name: "BIOS SPHERE proposals",
    });
    assert.equal(message.replyTo, "Ada@Example.com");
    assert.ok(message.text.includes(body.proposal.id));
    assert.ok(message.text.includes("How real systems fail in production"));
    assert.ok(message.text.includes("Ada Lovelace"));
    assert.ok(message.text.includes("Ada@Example.com"));
    assert.ok(!message.text.includes(validProposal().abstract));
    assert.ok(!message.text.includes(validProposal().groundingEvidence));
    assert.ok(!message.text.includes(validProposal().takeaway));
    assert.ok(!message.html.includes(validProposal().abstract));
  });

  test("notification uses a validated fixed operator destination", async (t) => {
    const database = createD1();
    const notifications = createEmailBinding();
    stubSuccessfulTurnstile(t);
    const env = createEnv({ database, notifications });
    env.PROPOSAL_NOTIFICATION_EMAIL = "Verified-Ops@Example.com";
    const { context, waits } = contextForSubmission({ env });

    const response = await onRequest(context);
    assert.equal(response.status, 201);
    await Promise.all(waits);

    assert.equal(notifications.messages.length, 1);
    assert.equal(notifications.messages[0].to, "verified-ops@example.com");
  });

  test("notification failure cannot turn a stored proposal into a failure", async (t) => {
    const database = createD1();
    const notifications = createEmailBinding({
      error: new Error("email service unavailable"),
      throwSynchronously: true,
    });
    const errors = silenceOperationalLogs(t);
    stubSuccessfulTurnstile(t);
    const { context, waits } = contextForSubmission({
      env: createEnv({ database, notifications }),
    });

    const response = await onRequest(context);
    assert.equal(response.status, 201);
    await Promise.all(waits);

    assert.ok(database.calls.some((call) => call.sql.includes("INSERT INTO")));
    assert.equal(errors.length, 1);
    assert.match(errors[0], /talk_proposal_notification_failed/u);
    assert.ok(!errors[0].includes("email service unavailable"));
    assert.ok(!errors[0].includes("Ada@Example.com"));
  });
});

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function validProposal() {
  return {
    name: "Ada Lovelace",
    email: "Ada@Example.com",
    cityRegion: "Vancouver, BC",
    workingTitle: "How real systems fail in production",
    formatPreference: "open",
    takeaway:
      "Attendees will leave with a practical checklist they can use tomorrow.",
    abstract:
      "This talk follows a real production system from an innocent design choice through failure, diagnosis, repair, and the safeguards that kept the same incident from recurring.",
    groundingEvidence:
      "The material comes from an anonymized incident and its follow-up tests.",
    links: ["https://example.com/talk", "https://example.com/slides"],
    recordingPreference: "discuss",
    conductAccepted: true,
    privacyConsent: true,
    website: "",
    startedAt: Date.now() - 5_000,
    "cf-turnstile-response": "turnstile-token",
  };
}

function createEnv({ database = createD1(), notifications } = {}) {
  const env = {
    PROPOSALS_DB: database,
    TURNSTILE_SITE_KEY: "public-site-key",
    TURNSTILE_SECRET_KEY: "private-secret-key",
  };
  if (notifications) env.PROPOSAL_NOTIFICATIONS = notifications;
  return env;
}

function createContext({ request, env = createEnv(), waits = [] } = {}) {
  return {
    request,
    env,
    params: {},
    data: {},
    waitUntil(promise) {
      waits.push(Promise.resolve(promise));
    },
  };
}

function contextForSubmission({ env } = {}) {
  const waits = [];
  const request = jsonRequest(validProposal());
  return { context: createContext({ request, env, waits }), waits };
}

function jsonRequest(input) {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(ENDPOINT).origin,
    },
    body: JSON.stringify(input),
  });
}

async function submitJson(input, env) {
  return onRequest(createContext({ request: jsonRequest(input), env }));
}

function createD1({
  recentCount = 0,
  insertResult = { success: true },
  insertError,
  sequence = [],
} = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...values) {
          calls.push({ sql, values });
          if (sql.includes("SELECT COUNT")) {
            return {
              async first() {
                return { proposal_count: recentCount };
              },
            };
          }
          if (sql.includes("INSERT INTO")) {
            return {
              async run() {
                sequence.push("insert");
                if (insertError) throw insertError;
                return insertResult;
              },
            };
          }
          throw new Error(`Unexpected SQL in test: ${sql}`);
        },
      };
    },
  };
}

function createEmailBinding({
  sequence = [],
  error,
  throwSynchronously = false,
} = {}) {
  const messages = [];
  return {
    messages,
    send(message) {
      sequence.push("email");
      messages.push(message);
      if (error && throwSynchronously) throw error;
      if (error) return Promise.reject(error);
      return Promise.resolve();
    },
  };
}

function stubFetch(t, implementation) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = implementation;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
}

function stubSuccessfulTurnstile(t) {
  stubFetch(t, async () =>
    Response.json({
      success: true,
      action: "talk_proposal",
      hostname: new URL(ENDPOINT).hostname,
    }),
  );
}

function silenceOperationalLogs(t) {
  const originalError = console.error;
  const errors = [];
  console.error = (...values) => {
    errors.push(values.join(" "));
  };
  t.after(() => {
    console.error = originalError;
  });
  return errors;
}
