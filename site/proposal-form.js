/**
 * BIOS SPHERE talk proposal form.
 *
 * The HTML owns the form contract and remains a same-origin POST. This script
 * adds accessible validation, explicit Turnstile readiness, fetch submission,
 * and in-page recovery/success states.
 */
(function () {
  "use strict";

  const form = document.getElementById("proposal-form");
  if (!form) return;

  const endpoint = form.getAttribute("action") || "/api/talk-proposals";
  const startedAt = document.getElementById("proposal-started-at");
  const submitButton = document.getElementById("proposal-submit");
  const submitStatus = document.getElementById("proposal-submit-status");
  const errorSummary = document.getElementById("proposal-errors");
  const errorHeading = document.getElementById("proposal-error-heading");
  const errorMessage = document.getElementById("proposal-error-message");
  const errorList = document.getElementById("proposal-error-list");
  const verificationContainer = document.getElementById("proposal-turnstile");
  const verificationStatus = document.getElementById("proposal-verification-status");
  const verificationRetry = document.getElementById("proposal-verification-retry");
  const successPanel = document.getElementById("proposal-success");
  const successReference = document.getElementById("proposal-reference");
  const submitAnother = document.getElementById("proposal-submit-another");
  const recordingGroup = document.getElementById("proposal-recording-group");

  const defaultSubmitLabel = submitButton ? submitButton.textContent.trim() : "Submit talk idea";
  let turnstileWidgetId = null;
  let turnstileToken = "";
  let verificationReady = false;
  let submitting = false;
  let turnstileLoadPromise = null;

  function announce(message) {
    if (submitStatus) submitStatus.textContent = message;
  }

  function setStartedAt() {
    if (startedAt) startedAt.value = String(Date.now());
  }

  function setVerificationState(message, state) {
    verificationReady = state === "ready";
    if (verificationStatus) {
      verificationStatus.textContent = message;
      verificationStatus.dataset.state = state;
    }
    updateSubmitAvailability();
  }

  function updateSubmitAvailability() {
    if (!submitButton) return;
    submitButton.disabled = submitting || !verificationReady;
  }

  function setSubmitting(next) {
    submitting = next;
    form.setAttribute("aria-busy", String(next));
    if (submitButton) {
      submitButton.classList.toggle("is-submitting", next);
      submitButton.textContent = next ? "Submitting…" : defaultSubmitLabel;
    }
    updateSubmitAvailability();
  }

  function clearValidationState() {
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
      field.removeAttribute("aria-invalid");
    });
    if (recordingGroup) recordingGroup.removeAttribute("aria-invalid");
    if (errorSummary) errorSummary.hidden = true;
    if (errorList) errorList.replaceChildren();
  }

  function fieldErrorMessage(field) {
    if (field.validity && field.validity.valueMissing) {
      return field.dataset.errorRequired || "Complete this required field.";
    }
    if (field.validity && field.validity.typeMismatch) {
      return field.dataset.errorType || "Enter a valid value.";
    }
    if (field.validity && field.validity.tooShort) {
      return field.dataset.errorMin || "Add a little more detail to this response.";
    }
    if (field.validity && field.validity.tooLong) {
      return "Shorten this response to the stated maximum length.";
    }
    return field.validationMessage || "Check this field.";
  }

  function addError(errors, field, message, key) {
    const identity = key || field.name || field.id;
    if (errors.some(function (error) { return error.key === identity; })) return;
    field.setAttribute("aria-invalid", "true");
    if (field.name === "recordingPreference" && recordingGroup) {
      recordingGroup.setAttribute("aria-invalid", "true");
    }
    errors.push({ key: identity, field: field, message: message });
  }

  function validateLinks(errors) {
    const linksField = document.getElementById("proposal-links");
    if (!linksField || !linksField.value.trim()) return;
    const links = linksField.value
      .split(/\r?\n/)
      .map(function (value) { return value.trim(); })
      .filter(Boolean);

    if (links.length > 2) {
      addError(errors, linksField, "Include no more than two links.", "links");
      return;
    }

    const invalid = links.some(function (value) {
      try {
        const url = new URL(value);
        return url.protocol !== "http:" && url.protocol !== "https:";
      } catch (_error) {
        return true;
      }
    });

    if (invalid) {
      addError(errors, linksField, "Enter complete public URLs beginning with http:// or https://, one per line.", "links");
    }
  }

  function validateForm() {
    clearValidationState();
    const errors = [];
    const fields = Array.from(form.elements).filter(function (field) {
      return field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement;
    });

    fields.forEach(function (field) {
      if (field.name === "website" || field.type === "hidden" || field.disabled) return;
      if (!field.validity.valid) {
        addError(errors, field, fieldErrorMessage(field));
      }
    });
    validateLinks(errors);

    if (!errors.length) return true;

    renderErrors(errors, "Some information needs your attention.");
    return false;
  }

  function renderErrors(errors, message, heading) {
    if (!errorSummary || !errorList) return;
    if (errorHeading) errorHeading.textContent = heading || "Check the form";
    errorMessage.textContent = message || "Some information needs your attention.";
    errorList.replaceChildren();
    errorList.hidden = errors.length === 0;

    errors.forEach(function (error) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#" + error.field.id;
      link.textContent = error.message;
      link.addEventListener("click", function (event) {
        event.preventDefault();
        error.field.focus();
      });
      item.appendChild(link);
      errorList.appendChild(item);
    });

    errorSummary.hidden = false;
    errorSummary.focus();
    if (errors.length) {
      announce(errors.length === 1 ? "There is one form error." : "There are " + errors.length + " form errors.");
    } else {
      announce(message || "The proposal could not be submitted.");
    }
  }

  function renderServerErrors(fieldErrors, fallbackMessage) {
    clearValidationState();
    const errors = [];
    if (fieldErrors && typeof fieldErrors === "object") {
      Object.keys(fieldErrors).forEach(function (name) {
        const field = form.elements.namedItem(name);
        const target = field instanceof RadioNodeList ? field[0] : field;
        if (!target || typeof target.focus !== "function" || target.type === "hidden") return;
        const supplied = Array.isArray(fieldErrors[name]) ? fieldErrors[name][0] : fieldErrors[name];
        addError(errors, target, serverFieldErrorMessage(target, supplied), name);
      });
    }

    const message = fallbackMessage || "We could not submit the idea. Check the form and try again.";
    renderErrors(errors, message, errors.length ? "Check the form" : "Submission problem");
  }

  function serverFieldErrorMessage(field, supplied) {
    const code = String(supplied || "");
    if (code === "required") return field.dataset.errorRequired || "Complete this required field.";
    if (code === "must_accept") return field.dataset.errorRequired || "Accept this agreement to continue.";
    if (code === "too_short") return field.dataset.errorMin || "Add a little more detail to this response.";
    if (code === "too_long") return "Shorten this response to the stated maximum length.";
    if (field.name === "email" && code === "invalid_format") {
      return field.dataset.errorType || "Enter a valid email address.";
    }
    if (field.name === "links" && code === "too_many") return "Include no more than two links.";
    if (field.name === "links" && (code === "invalid_url" || code === "invalid_type")) {
      return "Enter complete public URLs beginning with http:// or https://, one per line.";
    }
    if (code === "invalid_value") return "Choose one of the available options.";
    if (code === "invalid_characters") return "Remove unsupported control characters from this response.";
    return "Check this field and try again.";
  }

  function loadTurnstileApi() {
    if (window.turnstile && typeof window.turnstile.render === "function") {
      return Promise.resolve(window.turnstile);
    }
    if (turnstileLoadPromise) return turnstileLoadPromise;

    turnstileLoadPromise = new Promise(function (resolve, reject) {
      const existing = document.getElementById("cloudflare-turnstile-api");
      const script = existing || document.createElement("script");
      let settled = false;

      function resolveWhenReady() {
        if (settled) return;
        if (window.turnstile && typeof window.turnstile.render === "function") {
          settled = true;
          resolve(window.turnstile);
        }
      }

      function rejectLoad() {
        if (settled) return;
        settled = true;
        reject(new Error("Turnstile could not load."));
      }

      script.addEventListener("load", resolveWhenReady, { once: true });
      script.addEventListener("error", rejectLoad, { once: true });

      if (!existing) {
        script.id = "cloudflare-turnstile-api";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      window.setTimeout(function () {
        resolveWhenReady();
        if (!settled) rejectLoad();
      }, 12000);
    });

    return turnstileLoadPromise;
  }

  function removeTurnstileWidget() {
    if (turnstileWidgetId !== null && window.turnstile && typeof window.turnstile.remove === "function") {
      window.turnstile.remove(turnstileWidgetId);
    }
    turnstileWidgetId = null;
    turnstileToken = "";
    if (verificationContainer) verificationContainer.replaceChildren();
  }

  function resetTurnstile(message) {
    turnstileToken = "";
    verificationReady = false;
    if (turnstileWidgetId !== null && window.turnstile && typeof window.turnstile.reset === "function") {
      window.turnstile.reset(turnstileWidgetId);
      setVerificationState(message || "Complete human verification to submit.", "waiting");
    } else {
      setVerificationState(message || "Preparing human verification…", "loading");
    }
  }

  async function prepareVerification() {
    if (verificationRetry) verificationRetry.hidden = true;
    setVerificationState("Preparing human verification…", "loading");
    removeTurnstileWidget();

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "same-origin",
        headers: { "Accept": "application/json" }
      });
      const payload = await response.json().catch(function () { return null; });
      const nestedTurnstile = payload && payload.config && payload.config.turnstile;
      const siteKey = payload && typeof payload.turnstileSiteKey === "string"
        ? payload.turnstileSiteKey
        : nestedTurnstile && typeof nestedTurnstile.siteKey === "string"
          ? nestedTurnstile.siteKey
          : "";
      const action = payload && typeof payload.turnstileAction === "string"
        ? payload.turnstileAction
        : nestedTurnstile && typeof nestedTurnstile.action === "string"
          ? nestedTurnstile.action
          : "talk_proposal";
      if (!response.ok || !payload || payload.ok !== true || !siteKey.trim()) {
        throw new Error("Verification configuration is unavailable.");
      }

      const turnstile = await loadTurnstileApi();
      turnstileWidgetId = turnstile.render(verificationContainer, {
        sitekey: siteKey.trim(),
        action: action,
        theme: "light",
        callback: function (token) {
          turnstileToken = token;
          if (verificationRetry) verificationRetry.hidden = true;
          setVerificationState("Verification complete. You can submit your idea.", "ready");
          announce("Human verification complete.");
        },
        "expired-callback": function () {
          turnstileToken = "";
          setVerificationState("Verification expired. Complete it again to submit.", "waiting");
          announce("Human verification expired.");
        },
        "error-callback": function () {
          turnstileToken = "";
          setVerificationState("Verification had a problem. Try it again or use the email fallback.", "error");
          if (verificationRetry) verificationRetry.hidden = false;
          announce("Human verification had a problem.");
        }
      });
      setVerificationState("Complete human verification to enable submission.", "waiting");
    } catch (_error) {
      turnstileLoadPromise = null;
      const failedScript = document.getElementById("cloudflare-turnstile-api");
      if (failedScript && !window.turnstile) failedScript.remove();
      setVerificationState("Verification could not load. Try again or email your idea to the organizers.", "error");
      if (verificationRetry) verificationRetry.hidden = false;
      announce("Human verification could not load.");
    }
  }

  function responseMessage(payload, fallback) {
    if (!payload || typeof payload !== "object") return fallback;
    if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
    if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
    if (payload.error && typeof payload.error.message === "string" && payload.error.message.trim()) {
      return payload.error.message;
    }
    return fallback;
  }

  async function submitProposal(event) {
    event.preventDefault();
    if (submitting) return;

    if (!validateForm()) return;
    if (!verificationReady || !turnstileToken) {
      setVerificationState("Complete human verification before submitting.", "error");
      if (verificationStatus) verificationStatus.focus();
      announce("Complete human verification before submitting.");
      return;
    }

    setSubmitting(true);
    clearValidationState();
    announce("Submitting your talk idea.");

    const formData = new FormData(form);
    formData.set("cf-turnstile-response", turnstileToken);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Accept": "application/json" },
        body: formData
      });
      const payload = await response.json().catch(function () { return null; });
      if (!response.ok || !payload || payload.ok !== true) {
        const message = responseMessage(payload, "We could not submit the idea. Check the form and try again.");
        const fieldErrors = payload && (
          payload.fieldErrors ||
          payload.fields ||
          (payload.error && payload.error.fields)
        );
        renderServerErrors(fieldErrors, message);
        resetTurnstile("Complete human verification again to retry.");
        return;
      }

      form.hidden = true;
      if (successReference) {
        const proposalId = payload && payload.proposal && payload.proposal.id;
        successReference.textContent = typeof proposalId === "string" && proposalId.trim()
          ? proposalId.trim()
          : "Not provided—use your email and working title.";
      }
      if (successPanel) {
        successPanel.hidden = false;
        successPanel.focus();
      }
      announce("Your talk idea was submitted successfully.");
    } catch (_error) {
      renderServerErrors(null, "We could not reach the submission service. Your idea may not have been received; try again or use the email fallback.");
      resetTurnstile("Complete human verification again to retry.");
    } finally {
      setSubmitting(false);
    }
  }

  function startAnotherProposal() {
    form.reset();
    clearValidationState();
    setStartedAt();
    if (successPanel) successPanel.hidden = true;
    if (successReference) successReference.textContent = "Not provided—use your email and working title.";
    form.hidden = false;
    if (turnstileWidgetId !== null && window.turnstile && typeof window.turnstile.reset === "function") {
      resetTurnstile("Complete human verification to submit another idea.");
    } else {
      prepareVerification();
    }
    const firstField = document.getElementById("proposal-name");
    if (firstField) firstField.focus();
    announce("The form is ready for another talk idea.");
  }

  form.addEventListener("submit", submitProposal);
  form.addEventListener("input", function (event) {
    const field = event.target;
    if (field && typeof field.removeAttribute === "function") field.removeAttribute("aria-invalid");
    if (field && field.name === "recordingPreference" && recordingGroup) {
      recordingGroup.removeAttribute("aria-invalid");
    }
  });
  if (verificationRetry) verificationRetry.addEventListener("click", prepareVerification);
  if (submitAnother) submitAnother.addEventListener("click", startAnotherProposal);

  setStartedAt();
  updateSubmitAvailability();
  prepareVerification();
})();
