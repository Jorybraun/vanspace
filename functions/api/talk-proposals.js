const TURNSTILE_ACTION = "talk_proposal";
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_FROM_EMAIL = "proposals@vanspace.dev";
const ORGANIZER_EMAIL = "hello@vanspace.dev";
const MAX_BODY_BYTES = 64 * 1024;
const MIN_COMPLETION_TIME_MS = 3_000;
const MAX_FUTURE_START_MS = 30_000;
const EMAIL_RATE_LIMIT = 5;
const EMAIL_RATE_WINDOW_MS = 60 * 60 * 1_000;
const MAX_LINKS = 2;
const MAX_LINK_LENGTH = 500;

const FORMAT_PREFERENCES = Object.freeze([
  "talk-20",
  "demo-20",
  "feature-30",
  "open",
]);
const RECORDING_PREFERENCES = Object.freeze(["yes", "discuss", "no"]);

const FIELD_LIMITS = Object.freeze({
  name: Object.freeze({ min: 2, max: 100 }),
  email: Object.freeze({ max: 254 }),
  cityRegion: Object.freeze({ max: 120 }),
  workingTitle: Object.freeze({ min: 5, max: 120 }),
  takeaway: Object.freeze({ min: 20, max: 240 }),
  abstract: Object.freeze({ min: 80, max: 1_800 }),
  groundingEvidence: Object.freeze({ min: 20, max: 1_200 }),
  links: Object.freeze({ maxItems: MAX_LINKS, maxItemLength: MAX_LINK_LENGTH }),
});

const REQUIRED_FIELDS = Object.freeze([
  "name",
  "email",
  "workingTitle",
  "formatPreference",
  "takeaway",
  "abstract",
  "groundingEvidence",
  "recordingPreference",
  "conductAccepted",
  "privacyConsent",
  "startedAt",
  "cf-turnstile-response",
]);

const OPTIONAL_FIELDS = Object.freeze(["cityRegion", "links", "website"]);
const ALLOWED_FIELDS = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);

const SINGLE_LINE_CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;
const MULTILINE_CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const NON_ASCII_CHARACTERS = /[^\u0000-\u007f]/u;
const EMAIL_PATTERN =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

class RequestBodyError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "RequestBodyError";
    this.status = status;
    this.code = code;
  }
}

export async function onRequest(context) {
  switch (context.request.method.toUpperCase()) {
    case "GET":
      return handleGet(context);
    case "POST":
      return handlePost(context);
    default:
      return errorResponse(
        405,
        "METHOD_NOT_ALLOWED",
        "Only GET and POST are supported.",
        undefined,
        { Allow: "GET, POST" },
      );
  }
}

export async function onRequestGet(context) {
  return handleGet(context);
}

export async function onRequestPost(context) {
  return handlePost(context);
}

async function handleGet(context) {
  if (!hasRequiredBindings(context.env)) {
    return serviceUnavailableResponse();
  }

  return jsonResponse({
    ok: true,
    config: {
      version: 1,
      turnstile: {
        siteKey: context.env.TURNSTILE_SITE_KEY,
        action: TURNSTILE_ACTION,
      },
      formatPreferences: [...FORMAT_PREFERENCES],
      recordingPreferences: [...RECORDING_PREFERENCES],
      recordingPreferenceIsRelease: false,
      requiredFields: [...REQUIRED_FIELDS],
      optionalFields: [...OPTIONAL_FIELDS],
      fieldLimits: FIELD_LIMITS,
      antiAbuse: {
        minimumCompletionTimeMs: MIN_COMPLETION_TIME_MS,
        maximumBodyBytes: MAX_BODY_BYTES,
      },
      notificationsEnabled:
        hasEmailBinding(context.env) &&
        Boolean(getNotificationFromEmail(context.env.PROPOSAL_FROM_EMAIL)) &&
        Boolean(
          getNotificationToEmail(context.env.PROPOSAL_NOTIFICATION_EMAIL),
        ),
    },
  });
}

async function handlePost(context) {
  if (!hasRequiredBindings(context.env)) {
    return serviceUnavailableResponse();
  }

  if (!isSameOrigin(context.request)) {
    return errorResponse(
      403,
      "ORIGIN_NOT_ALLOWED",
      "This submission must come from the BIOS SPHERE site.",
    );
  }

  let input;
  try {
    input = await parseRequestInput(context.request);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return errorResponse(error.status, error.code, error.message);
    }
    return errorResponse(
      400,
      "INVALID_BODY",
      "The request body could not be read.",
    );
  }

  if (hasUnknownFields(input)) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Check the highlighted fields and try again.",
      { _form: "unknown_fields" },
    );
  }

  if (isHoneypotFilled(input.website)) {
    return errorResponse(
      400,
      "INVALID_SUBMISSION",
      "The submission could not be accepted.",
    );
  }

  const validation = validateAndNormalize(input, Date.now());
  if (!validation.ok) {
    return errorResponse(
      400,
      "VALIDATION_ERROR",
      "Check the highlighted fields and try again.",
      validation.fields,
    );
  }

  const proposalId = crypto.randomUUID();
  const turnstile = await verifyTurnstile({
    token: validation.value.turnstileToken,
    secret: context.env.TURNSTILE_SECRET_KEY,
    idempotencyKey: proposalId,
    expectedHostname: new URL(context.request.url).hostname,
  });

  if (turnstile === "unavailable") {
    return errorResponse(
      503,
      "VERIFICATION_UNAVAILABLE",
      "Verification is temporarily unavailable. Please try again.",
    );
  }

  if (turnstile !== "valid") {
    return errorResponse(
      403,
      "VERIFICATION_FAILED",
      "Verification failed. Refresh the challenge and try again.",
    );
  }

  const submittedAt = new Date().toISOString();
  const contentHash = await hashProposal(validation.value);
  const storageResult = await storeProposal(context.env.PROPOSALS_DB, {
    id: proposalId,
    submittedAt,
    contentHash,
    ...validation.value,
  });

  if (storageResult === "duplicate") {
    return errorResponse(
      409,
      "DUPLICATE_PROPOSAL",
      "This proposal has already been submitted.",
    );
  }

  if (storageResult === "rate_limited") {
    return errorResponse(
      429,
      "SUBMISSION_LIMIT_REACHED",
      "Too many proposals were submitted for this email address. Try again later.",
      undefined,
      { "Retry-After": String(EMAIL_RATE_WINDOW_MS / 1_000) },
    );
  }

  if (storageResult !== "stored") {
    logOperationalEvent("talk_proposal_storage_failed", proposalId);
    return errorResponse(
      503,
      "STORAGE_UNAVAILABLE",
      "The proposal could not be saved. Please try again.",
    );
  }

  scheduleOrganizerNotification(context, {
    id: proposalId,
    name: validation.value.name,
    email: validation.value.email,
    workingTitle: validation.value.workingTitle,
  });

  return jsonResponse(
    {
      ok: true,
      proposal: {
        id: proposalId,
        submittedAt,
      },
    },
    201,
  );
}

function hasRequiredBindings(env) {
  return Boolean(
    env &&
      env.PROPOSALS_DB &&
      typeof env.PROPOSALS_DB.prepare === "function" &&
      typeof env.TURNSTILE_SITE_KEY === "string" &&
      env.TURNSTILE_SITE_KEY.trim() &&
      typeof env.TURNSTILE_SECRET_KEY === "string" &&
      env.TURNSTILE_SECRET_KEY.trim(),
  );
}

function hasEmailBinding(env) {
  return Boolean(
    env?.PROPOSAL_NOTIFICATIONS &&
      typeof env.PROPOSAL_NOTIFICATIONS.send === "function",
  );
}

function isSameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin || origin === "null") return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function parseRequestInput(request) {
  const rawContentType = request.headers.get("Content-Type") ?? "";
  const contentType = rawContentType.split(";", 1)[0].trim().toLowerCase();
  const bytes = await readBoundedBody(request, MAX_BODY_BYTES);

  if (contentType === "application/json") {
    const text = decodeUtf8(bytes);
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new RequestBodyError(
        400,
        "INVALID_BODY",
        "The JSON request body is invalid.",
      );
    }

    if (!isPlainObject(parsed)) {
      throw new RequestBodyError(
        400,
        "INVALID_BODY",
        "The JSON request body must be an object.",
      );
    }
    return parsed;
  }

  if (contentType === "application/x-www-form-urlencoded") {
    return entriesToObject(new URLSearchParams(decodeUtf8(bytes)).entries());
  }

  if (contentType === "multipart/form-data") {
    let formData;
    try {
      formData = await new Response(bytes, {
        headers: { "Content-Type": rawContentType },
      }).formData();
    } catch {
      throw new RequestBodyError(
        400,
        "INVALID_BODY",
        "The form request body is invalid.",
      );
    }
    return entriesToObject(formData.entries());
  }

  throw new RequestBodyError(
    415,
    "UNSUPPORTED_MEDIA_TYPE",
    "Use JSON or form data for this endpoint.",
  );
}

async function readBoundedBody(request, maximumBytes) {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null) {
    if (!/^\d+$/u.test(contentLength)) {
      throw new RequestBodyError(
        400,
        "INVALID_BODY",
        "The Content-Length header is invalid.",
      );
    }
    if (Number(contentLength) > maximumBytes) {
      throw payloadTooLargeError();
    }
  }

  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel("request body too large");
        throw payloadTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function payloadTooLargeError() {
  return new RequestBodyError(
    413,
    "PAYLOAD_TOO_LARGE",
    "The request body is too large.",
  );
}

function decodeUtf8(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new RequestBodyError(
      400,
      "INVALID_BODY",
      "The request body must be valid UTF-8.",
    );
  }
}

function entriesToObject(entries) {
  const result = Object.create(null);
  for (const [key, value] of entries) {
    if (typeof value !== "string") {
      throw new RequestBodyError(
        400,
        "INVALID_BODY",
        "File uploads are not supported.",
      );
    }
    if (Object.hasOwn(result, key)) {
      throw new RequestBodyError(
        400,
        "INVALID_BODY",
        "Each form field may be submitted only once.",
      );
    }
    result[key] = value;
  }
  return result;
}

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
  );
}

function hasUnknownFields(input) {
  return Object.keys(input).some((field) => !ALLOWED_FIELDS.has(field));
}

function isHoneypotFilled(value) {
  if (value === undefined || value === null) return false;
  return typeof value !== "string" || value.trim().length > 0;
}

function validateAndNormalize(input, now) {
  const fields = Object.create(null);

  const name = readTextField(input, "name", fields, FIELD_LIMITS.name);
  const email = readTextField(input, "email", fields, {
    min: 3,
    max: FIELD_LIMITS.email.max,
  });
  const cityRegion = readTextField(
    input,
    "cityRegion",
    fields,
    { min: 0, max: FIELD_LIMITS.cityRegion.max },
    { required: false },
  );
  const workingTitle = readTextField(
    input,
    "workingTitle",
    fields,
    FIELD_LIMITS.workingTitle,
  );
  const takeaway = readTextField(
    input,
    "takeaway",
    fields,
    FIELD_LIMITS.takeaway,
    { multiline: true },
  );
  const abstract = readTextField(
    input,
    "abstract",
    fields,
    FIELD_LIMITS.abstract,
    { multiline: true },
  );
  const groundingEvidence = readTextField(
    input,
    "groundingEvidence",
    fields,
    FIELD_LIMITS.groundingEvidence,
    { multiline: true },
  );

  if (
    email &&
    (NON_ASCII_CHARACTERS.test(input.email) || !isValidEmail(email))
  ) {
    fields.email = "invalid_format";
  }

  const formatPreference = readEnumField(
    input,
    "formatPreference",
    FORMAT_PREFERENCES,
    fields,
  );
  const recordingPreference = readEnumField(
    input,
    "recordingPreference",
    RECORDING_PREFERENCES,
    fields,
  );
  const links = readLinks(input.links, fields);

  if (!isExplicitTrue(input.conductAccepted)) {
    fields.conductAccepted = "must_accept";
  }
  if (!isExplicitTrue(input.privacyConsent)) {
    fields.privacyConsent = "must_accept";
  }

  const startedAt = readStartedAt(input.startedAt, now, fields);
  const turnstileToken = readTextField(
    input,
    "cf-turnstile-response",
    fields,
    { min: 1, max: 2_048 },
  );

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      emailNormalized: email.toLowerCase(),
      cityRegion: cityRegion || null,
      workingTitle,
      formatPreference,
      takeaway,
      abstract,
      groundingEvidence,
      links,
      recordingPreference,
      conductAccepted: true,
      privacyConsent: true,
      startedAt,
      turnstileToken,
    },
  };
}

function readTextField(
  input,
  field,
  fields,
  limits,
  { required = true, multiline = false } = {},
) {
  const raw = input[field];
  if (raw === undefined || raw === null || raw === "") {
    if (required) fields[field] = "required";
    return "";
  }
  if (typeof raw !== "string") {
    fields[field] = "invalid_type";
    return "";
  }

  const value = raw.trim().normalize("NFC");
  if (!value) {
    if (required) fields[field] = "required";
    return "";
  }
  const invalidCharacters = multiline
    ? MULTILINE_CONTROL_CHARACTERS
    : SINGLE_LINE_CONTROL_CHARACTERS;
  if (invalidCharacters.test(value)) {
    fields[field] = "invalid_characters";
  } else if (
    limits.min !== undefined &&
    characterLength(value) < limits.min
  ) {
    fields[field] = "too_short";
  } else if (characterLength(value) > limits.max) {
    fields[field] = "too_long";
  }
  return value;
}

function readEnumField(input, field, allowed, fields) {
  const raw = input[field];
  if (raw === undefined || raw === null || raw === "") {
    fields[field] = "required";
    return "";
  }
  if (typeof raw !== "string" || !allowed.includes(raw)) {
    fields[field] = "invalid_value";
    return "";
  }
  return raw;
}

function readLinks(raw, fields) {
  if (raw === undefined || raw === null || raw === "") return [];

  let candidates;
  if (Array.isArray(raw)) {
    candidates = raw;
  } else if (typeof raw === "string") {
    candidates = raw.split(/\r?\n/u);
  } else {
    fields.links = "invalid_type";
    return [];
  }

  const values = candidates
    .map((value) => (typeof value === "string" ? value.trim() : value))
    .filter((value) => value !== "");

  if (values.some((value) => typeof value !== "string")) {
    fields.links = "invalid_type";
    return [];
  }
  if (values.length > MAX_LINKS) {
    fields.links = "too_many";
    return [];
  }

  const normalized = [];
  for (const value of values) {
    if (characterLength(value) > MAX_LINK_LENGTH) {
      fields.links = "too_long";
      return [];
    }
    try {
      const url = new URL(value);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        !url.hostname ||
        url.username ||
        url.password
      ) {
        throw new Error("unsupported URL");
      }
      normalized.push(url.href);
    } catch {
      fields.links = "invalid_url";
      return [];
    }
  }
  return normalized;
}

function isValidEmail(value) {
  if (!EMAIL_PATTERN.test(value)) return false;
  const separator = value.lastIndexOf("@");
  return separator > 0 && separator <= 64;
}

function characterLength(value) {
  return [...value].length;
}

function isExplicitTrue(value) {
  return value === true || value === "true" || value === "1" || value === "on";
}

function readStartedAt(raw, now, fields) {
  let value;
  if (typeof raw === "number") {
    value = raw;
  } else if (typeof raw === "string" && /^\d+$/u.test(raw)) {
    value = Number(raw);
  } else {
    fields.startedAt = raw === undefined || raw === null || raw === ""
      ? "required"
      : "invalid_time";
    return 0;
  }

  if (!Number.isSafeInteger(value) || value <= 0 || value > now + MAX_FUTURE_START_MS) {
    fields.startedAt = "invalid_time";
  } else if (now - value < MIN_COMPLETION_TIME_MS) {
    fields.startedAt = "too_fast";
  }
  return value;
}

async function verifyTurnstile({
  token,
  secret,
  idempotencyKey,
  expectedHostname,
}) {
  let response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        idempotency_key: idempotencyKey,
      }),
    });
  } catch {
    return "unavailable";
  }

  if (!response.ok) return "unavailable";

  let result;
  try {
    result = await response.json();
  } catch {
    return "unavailable";
  }

  if (!result || typeof result !== "object") return "unavailable";
  if (result.success !== true && hasTurnstileServiceError(result)) {
    return "unavailable";
  }
  if (
    result.success !== true ||
    result.action !== TURNSTILE_ACTION ||
    result.hostname !== expectedHostname
  ) {
    return "rejected";
  }
  return "valid";
}

function hasTurnstileServiceError(result) {
  if (!Array.isArray(result["error-codes"])) return false;
  return result["error-codes"].some((code) =>
    [
      "bad-request",
      "internal-error",
      "invalid-input-secret",
      "missing-input-secret",
    ].includes(code),
  );
}

async function hashProposal(proposal) {
  const canonical = JSON.stringify({
    name: proposal.name,
    email: proposal.emailNormalized,
    cityRegion: proposal.cityRegion,
    workingTitle: proposal.workingTitle,
    formatPreference: proposal.formatPreference,
    takeaway: proposal.takeaway,
    abstract: proposal.abstract,
    groundingEvidence: proposal.groundingEvidence,
    links: proposal.links,
    recordingPreference: proposal.recordingPreference,
    conductAccepted: proposal.conductAccepted,
    privacyConsent: proposal.privacyConsent,
  });
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function storeProposal(database, proposal) {
  const cutoff = new Date(
    new Date(proposal.submittedAt).getTime() - EMAIL_RATE_WINDOW_MS,
  ).toISOString();

  try {
    const recent = await database
      .prepare(
        `SELECT COUNT(*) AS proposal_count
         FROM talk_proposals
         WHERE email_normalized = ? AND created_at >= ?`,
      )
      .bind(proposal.emailNormalized, cutoff)
      .first();
    const count = Number(recent?.proposal_count ?? 0);
    if (!Number.isFinite(count)) return "failed";
    if (count >= EMAIL_RATE_LIMIT) return "rate_limited";

    const result = await database
      .prepare(
        `INSERT INTO talk_proposals (
           id,
           created_at,
           name,
           email,
           email_normalized,
           city_region,
           working_title,
           format_preference,
           takeaway,
           abstract,
           grounding_evidence,
           links_json,
           recording_preference,
           conduct_accepted,
           privacy_consent,
           content_hash
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        proposal.id,
        proposal.submittedAt,
        proposal.name,
        proposal.email,
        proposal.emailNormalized,
        proposal.cityRegion,
        proposal.workingTitle,
        proposal.formatPreference,
        proposal.takeaway,
        proposal.abstract,
        proposal.groundingEvidence,
        JSON.stringify(proposal.links),
        proposal.recordingPreference,
        1,
        1,
        proposal.contentHash,
      )
      .run();

    return result?.success === false ? "failed" : "stored";
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("talk_proposals.content_hash") ||
      message.includes("talk_proposals_content_hash_unique")
    ) {
      return "duplicate";
    }
    if (message.includes("talk_proposals_rate_limited")) {
      return "rate_limited";
    }
    return "failed";
  }
}

function scheduleOrganizerNotification(context, proposal) {
  if (!hasEmailBinding(context.env)) return;

  const fromEmail = getNotificationFromEmail(context.env.PROPOSAL_FROM_EMAIL);
  const toEmail = getNotificationToEmail(
    context.env.PROPOSAL_NOTIFICATION_EMAIL,
  );
  if (!fromEmail || !toEmail || typeof context.waitUntil !== "function") {
    logOperationalEvent("talk_proposal_notification_misconfigured", proposal.id);
    return;
  }

  const text = [
    "New BIOS SPHERE talk proposal",
    "",
    `Proposal ID: ${proposal.id}`,
    `Working title: ${proposal.workingTitle}`,
    `Submitted by: ${proposal.name}`,
    `Reply to: ${proposal.email}`,
  ].join("\n");
  const html = `<h1>New BIOS SPHERE talk proposal</h1>
<dl>
  <dt>Proposal ID</dt><dd>${escapeHtml(proposal.id)}</dd>
  <dt>Working title</dt><dd>${escapeHtml(proposal.workingTitle)}</dd>
  <dt>Submitted by</dt><dd>${escapeHtml(proposal.name)}</dd>
  <dt>Reply to</dt><dd>${escapeHtml(proposal.email)}</dd>
</dl>`;

  const notification = Promise.resolve()
    .then(() => context.env.PROPOSAL_NOTIFICATIONS.send({
      to: toEmail,
      from: { email: fromEmail, name: "BIOS SPHERE proposals" },
      replyTo: proposal.email,
      subject: `New talk proposal · ${proposal.workingTitle}`,
      text,
      html,
    }))
    .catch(() => {
      logOperationalEvent("talk_proposal_notification_failed", proposal.id);
    });

  try {
    context.waitUntil(notification);
  } catch {
    logOperationalEvent("talk_proposal_notification_misconfigured", proposal.id);
  }
}

function getNotificationFromEmail(value) {
  return getConfiguredEmail(value, DEFAULT_FROM_EMAIL);
}

function getNotificationToEmail(value) {
  return getConfiguredEmail(value, ORGANIZER_EMAIL);
}

function getConfiguredEmail(value, fallback) {
  const candidate = typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : fallback;
  return isValidEmail(candidate) ? candidate : null;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function logOperationalEvent(event, proposalId) {
  console.error(JSON.stringify({ event, proposalId }));
}

function serviceUnavailableResponse() {
  return errorResponse(
    503,
    "SERVICE_UNAVAILABLE",
    "Talk proposal submissions are temporarily unavailable.",
  );
}

function errorResponse(status, code, message, fields, extraHeaders) {
  const error = { code, message };
  if (fields && Object.keys(fields).length > 0) error.fields = fields;
  return jsonResponse({ ok: false, error }, status, extraHeaders);
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}
