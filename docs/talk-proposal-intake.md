# Talk proposal intake

The public talk-proposal page is served by the existing Cloudflare Pages
project. A dedicated Worker owns the API route so D1 storage, Turnstile
verification, and Email Service stay independent from the static deployment.

## Public contract

- Page: `/propose/`
- Endpoint: `GET|POST /api/talk-proposals`
- Static host: Cloudflare Pages project `vanspace`
- API Worker: `biossphere-talk-proposals`
- Storage: D1 database `biossphere-talk-proposals`, bound as
  `PROPOSALS_DB`
- Spam protection: Turnstile, checked server-side for the exact request host
  and action `talk_proposal`
- Organizer notification: Email Service binding
  `PROPOSAL_NOTIFICATIONS`, restricted to
  `proposals@vanspace.dev` → `hello@vanspace.dev`
- Human fallback: `hello@vanspace.dev`

The endpoint stores a proposal independently from the private CRM and from any
accepted session. It does not create Contacts, subscribe anyone to marketing,
or store raw IP addresses, user agents, or Turnstile tokens.

## Cloudflare architecture

The Pages project is a Direct Upload project. Deploy only the contents of
`site/` to Pages. Do not deploy the repository root to Pages: the root
`functions/` module is a shared request handler imported by the dedicated
Worker, not a Pages Function in production.

The Worker configuration lives at `worker/wrangler.jsonc` and declares:

- exact API routes for `biossphere.dev`, `vanspace.dev`, and
  `www.vanspace.dev`;
- the `PROPOSALS_DB` D1 binding;
- the restricted `PROPOSAL_NOTIFICATIONS` send binding;
- public, non-secret form and email settings; and
- Workers Logs and sampled traces.

The Turnstile secret must only be uploaded as an encrypted Worker secret:

```sh
wrangler secret put TURNSTILE_SECRET_KEY --config worker/wrangler.jsonc
```

Never commit the Turnstile secret, Cloudflare API tokens, or local
`.dev.vars`.

## Provisioning and deployment

1. Create the dedicated D1 database and apply
   `migrations/talk-proposals/0001_create_talk_proposals.sql`.
2. Enable Email Sending for `vanspace.dev`.
3. Create a managed Turnstile widget for the production hostnames and local QA.
4. Validate the Worker config and deploy it:

   ```sh
   wrangler deploy --config worker/wrangler.jsonc --dry-run
   wrangler secret put TURNSTILE_SECRET_KEY --config worker/wrangler.jsonc
   wrangler deploy --config worker/wrangler.jsonc
   ```

   The checked-in config declares `TURNSTILE_SECRET_KEY` as required. On a
   brand-new account, make the first bootstrap deployment from a temporary
   config copy with only the `secrets.required` block removed, upload the
   secret immediately with `wrangler secret put`, then deploy the checked-in
   config. The bootstrap route fails closed until the secret exists. Never put
   the secret in that temporary config or any file.

5. From `site/`, deploy the static assets to Pages:

   ```sh
   wrangler pages deploy . --project-name vanspace --branch main
   ```

## Verification

Run the deterministic checks before deployment:

```sh
node --check site/proposal-form.js
node --check functions/api/talk-proposals.js
node --check worker/talk-proposals-worker.js
node --test test/talk-proposals.test.mjs test/talk-proposals-worker.test.mjs
sqlite3 /tmp/biossphere-talk-proposals-check.db \
  ".read migrations/talk-proposals/0001_create_talk_proposals.sql" \
  ".schema talk_proposals"
```

After deployment:

1. `GET /api/talk-proposals` returns `200`, the public Turnstile site key,
   and no secret.
2. Submit one clearly synthetic proposal with keyboard-only navigation.
3. Confirm exactly one D1 row exists and the browser shows the same opaque
   proposal reference.
4. Confirm the organizer notification contains routing metadata, not the
   abstract or evidence text.
5. Delete the synthetic row by its exact proposal ID.
6. Repeat failure checks for an expired Turnstile token, duplicate submission,
   narrow mobile layout, reduced motion, and the email fallback.

## Review operations

List recent proposals without exposing full abstracts in routine output:

```sql
SELECT
  id,
  created_at,
  name,
  email,
  working_title,
  format_preference,
  recording_preference
FROM talk_proposals
ORDER BY created_at DESC;
```

Use the opaque `id` for update or deletion requests. Decide and document a
retention period before public activation; no future-event reuse is implied by
the form consent.

Cloudflare references:

- [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [D1 bindings](https://developers.cloudflare.com/d1/worker-api/d1-database/)
- [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Email Service send bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/)
- [Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
