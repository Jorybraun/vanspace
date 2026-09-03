import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";

const markup = await readFile(
  new URL("../site/propose/index.html", import.meta.url),
  "utf8",
);
const script = await readFile(
  new URL("../site/proposal-form.js", import.meta.url),
  "utf8",
);

function controlByName(name) {
  const match = markup.match(
    new RegExp(`<(?:input|select|textarea)\\b[^>]*\\bname="${name}"[^>]*>`, "su"),
  );
  assert.ok(match, `expected a form control named ${name}`);
  return match[0];
}

function controlById(id) {
  const match = markup.match(
    new RegExp(`<(?:input|select|textarea)\\b[^>]*\\bid="${id}"[^>]*>`, "su"),
  );
  assert.ok(match, `expected a form control with id ${id}`);
  return match[0];
}

describe("streamlined proposal form contract", () => {
  test("keeps the same secure submission and recovery hooks", () => {
    assert.match(
      markup,
      /<form\b[^>]*\bid="proposal-form"[^>]*\baction="\/api\/talk-proposals"[^>]*\bmethod="post"/su,
    );
    assert.match(controlByName("startedAt"), /\btype="hidden"/u);
    assert.match(controlByName("website"), /\btabindex="-1"/u);

    for (const id of [
      "proposal-errors",
      "proposal-turnstile",
      "proposal-verification-retry",
      "proposal-submit",
      "proposal-submit-status",
      "proposal-success",
      "proposal-reference",
      "proposal-submit-another",
    ]) {
      assert.match(markup, new RegExp(`\\bid="${id}"`, "u"), id);
    }

    assert.match(markup, /mailto:hello@vanspace\.dev\?subject=BIOS%20SPHERE%20talk%20idea/u);
  });

  test("keeps every required content field and matching length limits", () => {
    const requiredFields = [
      ["name", 2, 100],
      ["workingTitle", 5, 120],
      ["takeaway", 20, 240],
      ["abstract", 80, 1800],
      ["groundingEvidence", 20, 1200],
    ];

    assert.match(controlByName("email"), /\btype="email"/u);
    assert.match(controlByName("email"), /\brequired\b/u);

    for (const [name, minimum, maximum] of requiredFields) {
      const control = controlByName(name);
      assert.match(control, /\brequired\b/u, name);
      assert.match(control, new RegExp(`\\bminlength="${minimum}"`, "u"), name);
      assert.match(control, new RegExp(`\\bmaxlength="${maximum}"`, "u"), name);
    }
  });

  test("collapses optional details and supplies neutral preference defaults", () => {
    assert.match(markup, /<details\b[^>]*\bclass="proposal-optional-details"/u);
    assert.match(markup, /<strong>Optional details<\/strong>/u);

    const city = controlByName("cityRegion");
    const links = controlByName("links");
    assert.doesNotMatch(city, /\brequired\b/u);
    assert.doesNotMatch(links, /\brequired\b/u);

    const format = controlByName("formatPreference");
    assert.match(format, /\brequired\b/u);
    assert.match(markup, /<option\b[^>]*\bvalue="open"[^>]*\bselected\b[^>]*>Open to fit<\/option>/u);

    const recording = controlById("proposal-recording-discuss");
    assert.match(recording, /\bvalue="discuss"/u);
    assert.match(recording, /\brequired\b/u);
    assert.match(recording, /\bchecked\b/u);
    assert.match(script, /error\.field\.closest\("details"\)/u);
    assert.match(script, /disclosure\.open = true/u);
    assert.match(script, /form\.querySelectorAll\("details\[open\]"\)/u);
  });

  test("keeps conduct and privacy consent explicit", () => {
    assert.match(controlByName("conductAccepted"), /\brequired\b/u);
    assert.match(controlByName("privacyConsent"), /\brequired\b/u);
    assert.match(markup, /I have read and accept the BIOS SPHERE Code of Conduct\./u);
    assert.match(markup, /not for marketing/u);
  });
});
