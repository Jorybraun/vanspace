/**
 * VanSpace hero: dithered Science World -> orbit map of the day.
 *
 * The sketch is Floyd-Steinberg dithered at runtime, so the halftone dots ARE
 * the particles. Scrolling the stage releases them into orbit and inverts the
 * page from cream to deep blue. No extra image assets.
 *
 * Respects prefers-reduced-motion: static sketch, short stage, no animation.
 */
(function () {
  const stage = document.getElementById("orbit-stage");
  const canvas = document.getElementById("orbit-canvas");
  if (!stage || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const heroCopy = document.getElementById("orbit-copy");
  const legend = document.getElementById("orbit-legend");
  const readout = document.getElementById("orbit-readout");
  const flagship = stage.querySelector(".orbit-flagship");
  const posterFrame = stage.querySelector(".poster-art-frame");
  const transition = document.getElementById("wormhole-transition");
  const cogSun = document.getElementById("orbit-cog-sun");
  const hermesOrbit = document.getElementById("orbit-hermes-orbit");
  const speakersPanel = document.getElementById("orbit-speakers");
  const sponsorPanel = document.getElementById("orbit-sponsors");
  const venuePanel = document.getElementById("orbit-venue");
  const biosChrome = document.getElementById("orbit-bios-chrome");
  const biosNav = document.getElementById("orbit-bios-nav");
  const statusEl = document.getElementById("orbit-status");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GROUND = [229, 224, 207]; // --ground
  /* Classic-ish BSOD blue (not pure #00f — readable with cream particles) */
  const DEEP = [0, 0, 170]; // #0000AA
  const INK_BLUE = [0, 0, 170];

  /* ---- Console: BIOS boot, then scroll unlocks more load chapters ---- */
  const bsodEl = document.getElementById("orbit-bsod");
  const bsodText = document.getElementById("orbit-bsod-text");
  const bsodCursor = document.getElementById("orbit-bsod-cursor");
  const introEl = document.getElementById("orbit-intro");
  const introKicker = document.getElementById("orbit-intro-kicker");
  const introTitle = document.getElementById("orbit-intro-title");
  const introMission = document.getElementById("orbit-intro-mission");
  const introMeta = document.getElementById("orbit-intro-meta");
  const dayAddressEl = document.getElementById("orbit-day-address");
  const devinLogoEl = document.getElementById("orbit-devin-logo");
  const speakerBack = document.getElementById("orbit-speaker-back");
  const speakerCards = stage ? stage.querySelectorAll(".orbit-spk") : [];
  const lineUpPanel = document.getElementById("orbit-lineup-panel");
  const schedulePanel = document.getElementById("orbit-schedule-panel");
  const lineUpTab = document.getElementById("orbit-lineup-tab");
  const scheduleTab = document.getElementById("orbit-schedule-tab");
  const scheduleBack = document.getElementById("orbit-schedule-back");
  const speakerDetail = document.getElementById("orbit-speaker-detail");
  const speakerDetailBack = document.getElementById("orbit-speaker-detail-back");
  const speakerDetailTag = document.getElementById("orbit-speaker-detail-tag");
  const speakerDetailName = document.getElementById("orbit-speaker-detail-name");
  const speakerDetailMeta = document.getElementById("orbit-speaker-detail-meta");
  const speakerDetailDesc = document.getElementById("orbit-speaker-detail-desc");
  const ticketDetail = document.getElementById("orbit-ticket-detail");
  const ticketDetailTitle = document.getElementById("orbit-ticket-detail-title");
  const ticketDetailPrice = document.getElementById("orbit-ticket-detail-price");
  const ticketDetailDesc = document.getElementById("orbit-ticket-detail-desc");
  const ticketDetailCta = document.getElementById("orbit-ticket-cta");
  const ticketBack = document.getElementById("orbit-ticket-back");
  const ticketClose = document.getElementById("orbit-ticket-close");
  const ticketCards = stage ? stage.querySelectorAll("[data-ticket]") : [];
  const navEl = document.querySelector(".nav");
  const TICKETS_LIVE = false;

  /* Blue-first: boot on blue → manifesto → scroll modules */
  const BLUE_FIRST = true;

  /* Dynamic title block shown above the console body for each phase */
  const TITLE_BLOCKS = {
    intro: {
      kicker: "SCIENCE WORLD",
      title: "A one-day, single-track conference packed with value.",
      mission: "A focused day for engineers, designers, and curious people making things.",
      meta: "Mon 2 Nov 2026 · 13:00–19:00 · Science World"
    },
    speakers: {
      kicker: "LINE-UP",
      title: "Kent C. Dodds opens",
      mission: "Opening keynote locked. Second keynote and sessions announcing soon.",
      meta: "Mon 2 Nov 2026 · Science World"
    },
    sponsors: {
      kicker: "MEGA.DEV · PRODUCT WEEK",
      title: "AI-Native Product Development.",
      mission: "Three hands-on hours with Kent C. Dodds. Thirty seats.",
      meta: "Morning · Mon 2 Nov 2026 · Science World"
    }
  };
  const BOOT_SCRIPT = [
    "BIOS SPHERE (C) 2026",
    "",
    "C:\\VANSPACE> boot programme.exe",
    "Loading micro-conference...",
    "  cognition.......... OK",
    "  keynotes........... OK",
    "  single track....... OK",
    "  Science World...... OK",
    "  2 Nov 2026........ OK",
    "  13:00–19:00........ OK",
    "  loading devin...... OK",
    "",
    "Boot complete."
  ].join("\n");

  /* Scroll gates: venue → speakers → sponsors. */
  const SPEAKERS_AT = 0.28;
  const SPONSORS_AT = 0.72;

  /** Scroll the page so stage progress ≈ targetP (0–1) */
  function scrollStageTo(targetP) {
    const rect = stage.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight);
    const next = window.scrollY + rect.top + Math.min(1, Math.max(0, targetP)) * total;
    window.scrollTo({ top: next, behavior: "smooth" });
  }

  if (biosNav) {
    biosNav.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-bios-jump]");
      if (!btn) return;
      e.preventDefault();
      const jump = btn.getAttribute("data-bios-jump");
      if (jump === "venue") scrollStageTo(0.04);
      else if (jump === "sponsors") scrollStageTo(SPONSORS_AT + 0.04);
      else if (jump === "speakers") scrollStageTo(SPEAKERS_AT + 0.04);
    });
  }

  /* Speakers phase — no public run-of-show until times are real */
  const SCHEDULE_LINES = [
    "Schedule coming soon.",
    "",
    "Mon 2 Nov 2026 · 13:00–19:00",
    "Science World, Vancouver."
  ].join("\n");

  /* Workshop phase — don't retype the headline */
  const SPONSOR_LINES = [
    "Explore > Plan > Execute",
    "Feedback > Engineer > Deliver",
    "",
    "Bring your laptop. Leave with a system."
  ].join("\n");

  /* phase: boot | intro | sponsors | speakers */
  let phase = "boot";
  let consoleTyped = 0;
  let consoleLastTick = 0;
  let consoleTarget = "";
  let bsodDone = false;
  let bsodDoneAt = 0;
  let introAt = 0;
  let lastScrollP = 0;
  let scrollVel = 0;
  let orbitForm = 0;
  let lastAnnouncedPhase = "";
  let speakerDetailActive = false;
  let mobileDialogTrigger = null;

  function updateTitleBlock(forPhase, visible) {
    const data = TITLE_BLOCKS[forPhase] || TITLE_BLOCKS.intro;
    if (introKicker) introKicker.textContent = data.kicker;
    if (introTitle) introTitle.textContent = data.title;
    if (introMission) introMission.textContent = data.mission;
    if (introMeta) introMeta.textContent = data.meta;

    if (!introEl) return;
    introEl.classList.toggle("is-on", visible);
    introEl.setAttribute("aria-hidden", visible ? "false" : "true");
    if (bsodEl) bsodEl.classList.toggle("is-manifesto", forPhase === "intro" && visible);
    if (bsodCursor) bsodCursor.style.display = forPhase === "intro" ? "none" : "";
    if (dayAddressEl) {
      dayAddressEl.classList.toggle("is-on", forPhase === "day" && visible);
      dayAddressEl.setAttribute("aria-hidden", forPhase === "day" && visible ? "false" : "true");
    }
  }

  /* Live countdown to the event in the Devin CLI header */
  const EVENT_DATE = new Date("2026-11-02T13:00:00-08:00");

  function formatCountdown(ms) {
    if (ms <= 0) return "resets now";
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = function (n) { return String(n).padStart(2, "0"); };
    if (days > 0) {
      return "resets in " + days + "d " + pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
    }
    return "resets in " + pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
  }

  function updateDevinCountdown() {
    if (!devinLogoEl) return;
    const now = new Date().getTime();
    const remaining = EVENT_DATE.getTime() - now;
    devinLogoEl.textContent = [
      "⠀⣴⣾⣶⡄⠀⠀⠀⠀",
      "⠀⠛⠿⠟⠻⣶⣾⣶⡄  BIOS SPHERE",
      "⠀⣤⣶⣦⣴⠿⢿⠿⠃  Max · 100% remaining",
      "⠀⠻⢿⠿⠃⠀⠀⠀⠀",
      "           " + formatCountdown(remaining)
    ].join("\n");
  }

  updateDevinCountdown();
  setInterval(updateDevinCountdown, 1000);

  function setDevinMode(on) {
    if (bsodEl) bsodEl.classList.toggle("is-devin", on);
  }

  if (BLUE_FIRST && stage) {
    stage.classList.add("is-blue-first");
  }

  function phaseTarget() {
    if (phase === "boot") return BOOT_SCRIPT;
    if (phase === "intro") return "";
    if (phase === "sponsors") return SPONSOR_LINES;
    if (phase === "speakers") return SCHEDULE_LINES;
    return "";
  }

  function setPhase(next, now) {
    if (phase === next) return;
    phase = next;
    consoleTyped = 0;
    consoleLastTick = 0;
    consoleTarget = phaseTarget();
    if (bsodEl) bsodEl.scrollTop = 0;
    setDevinMode(next === "sponsors");
    updateTitleBlock(next, next !== "boot");
    if (next !== "intro") closeTicketDetail();
    if (next !== "speakers") closeSpeakerDetail();
    if (next === "intro") {
      introAt = now || performance.now();
      if (bsodText) bsodText.textContent = "";
    }
    if (statusEl && next !== "boot") {
      const labels = {
        intro: "VanSpace",
        sponsors: "Workshop loaded — AI-Native Product Development with Kent C. Dodds",
        speakers: "Schedule loaded — line-up on the right"
      };
      if (labels[next] && labels[next] !== lastAnnouncedPhase) {
        lastAnnouncedPhase = labels[next];
        statusEl.textContent = labels[next];
      }
    }
  }

  function setProgrammeView(view) {
    const showSchedule = view === "schedule" && window.matchMedia("(max-width: 899px)").matches;
    if (lineUpPanel) lineUpPanel.hidden = showSchedule;
    if (schedulePanel) {
      schedulePanel.hidden = !showSchedule;
      schedulePanel.setAttribute("aria-hidden", showSchedule ? "false" : "true");
    }
    if (lineUpTab) {
      lineUpTab.classList.toggle("is-active", !showSchedule);
      lineUpTab.setAttribute("aria-selected", String(!showSchedule));
    }
    if (scheduleTab) {
      scheduleTab.classList.toggle("is-active", showSchedule);
      scheduleTab.setAttribute("aria-selected", String(showSchedule));
    }
  }

  function focusMobileDialog(dialog) {
    if (window.matchMedia("(max-width: 899px)").matches && dialog) {
      window.requestAnimationFrame(function () { dialog.focus(); });
    }
  }

  function restoreMobileDialogFocus() {
    const trigger = mobileDialogTrigger;
    mobileDialogTrigger = null;
    if (trigger && typeof trigger.focus === "function") trigger.focus();
  }

  if (lineUpTab) {
    lineUpTab.addEventListener("click", function () {
      if (speakerDetail) speakerDetail.hidden = true;
      setProgrammeView("lineup");
      restoreMobileDialogFocus();
    });
  }
  if (scheduleTab) {
    scheduleTab.addEventListener("click", function () {
      mobileDialogTrigger = scheduleTab;
      setProgrammeView("schedule");
      focusMobileDialog(schedulePanel);
    });
  }

  function closeMobileSpeakerDetail() {
    if (!speakerDetail) return;
    speakerDetail.hidden = true;
    speakerDetail.setAttribute("aria-hidden", "true");
    setProgrammeView("lineup");
    restoreMobileDialogFocus();
  }

  function closeMobileSchedule() {
    if (!schedulePanel) return;
    schedulePanel.hidden = true;
    schedulePanel.setAttribute("aria-hidden", "true");
    setProgrammeView("lineup");
    restoreMobileDialogFocus();
  }

  /* ---- Speaker detail in the left console ---------------------------- */
  function closeSpeakerDetail() {
    speakerDetailActive = false;
    closeMobileSpeakerDetail();
    if (speakerBack) speakerBack.classList.remove("is-on");
    if (phase === "speakers") {
      consoleTyped = 0;
      consoleLastTick = 0;
      consoleTarget = SCHEDULE_LINES;
      if (bsodText) bsodText.textContent = "";
      updateTitleBlock("speakers", true);
    }
  }

  function openSpeakerDetail(card) {
    if (!card) return;
    speakerDetailActive = true;
    const name = card.getAttribute("data-name") || "";
    const tag = card.getAttribute("data-tag") || "";
    const meta = card.getAttribute("data-meta") || "";
    const desc = card.getAttribute("data-desc") || "";

    if (introKicker) introKicker.textContent = "LINEUP";
    if (introTitle) introTitle.textContent = name;
    if (introMission) introMission.textContent = tag;
    if (introMeta) introMeta.textContent = meta;
    if (speakerBack) speakerBack.classList.add("is-on");
    if (speakerDetailTag) speakerDetailTag.textContent = tag;
    if (speakerDetailName) speakerDetailName.textContent = name;
    if (speakerDetailMeta) speakerDetailMeta.textContent = meta;
    if (speakerDetailDesc) speakerDetailDesc.textContent = desc || "Details announcing soon.";
    if (window.matchMedia("(max-width: 899px)").matches && speakerDetail) {
      mobileDialogTrigger = card;
      setProgrammeView("lineup");
      speakerDetail.hidden = false;
      speakerDetail.setAttribute("aria-hidden", "false");
      if (lineUpPanel) lineUpPanel.hidden = true;
      focusMobileDialog(speakerDetail);
    }

    consoleTyped = 0;
    consoleLastTick = 0;
    consoleTarget = desc;
    if (bsodText) bsodText.textContent = "";
  }

  if (speakerBack) {
    speakerBack.addEventListener("click", function () {
      closeSpeakerDetail();
    });
  }
  if (speakerDetailBack) {
    speakerDetailBack.addEventListener("click", closeMobileSpeakerDetail);
  }
  if (scheduleBack) {
    scheduleBack.addEventListener("click", closeMobileSchedule);
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (ticketDetail && ticketDetail.classList.contains("is-on")) {
      closeTicketDetail();
      return;
    }
    if (!window.matchMedia("(max-width: 899px)").matches) return;
    if (speakerDetail && !speakerDetail.hidden) closeMobileSpeakerDetail();
    else if (schedulePanel && !schedulePanel.hidden) closeMobileSchedule();
  });

  if (speakerCards.length) {
    speakerCards.forEach(function (card) {
      card.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
      });
      card.addEventListener("click", function () {
        openSpeakerDetail(card);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openSpeakerDetail(card);
        }
      });
    });
  }

  /* ---- Ticket detail overlay in the day panel ------------------------ */
  function closeTicketDetail() {
    if (!ticketDetail) return;
    ticketDetail.classList.remove("is-on");
    ticketDetail.setAttribute("aria-hidden", "true");
  }

  function openTicketDetail(card) {
    if (!TICKETS_LIVE || !ticketDetail || !ticketDetailTitle || !ticketDetailPrice || !ticketDetailDesc || !ticketDetailCta) return;
    ticketDetailTitle.textContent = card.querySelector(".orbit-tix-tag")?.textContent || "Ticket";
    ticketDetailPrice.textContent = card.getAttribute("data-price") || "";
    ticketDetailDesc.textContent = card.getAttribute("data-desc") || "";
    ticketDetailCta.textContent = card.getAttribute("data-cta") || "Get ticket";
    ticketDetailCta.href = card.getAttribute("data-luma") || "#";
    ticketDetail.classList.add("is-on");
    ticketDetail.setAttribute("aria-hidden", "false");
  }

  if (TICKETS_LIVE && ticketCards.length) {
    ticketCards.forEach(function (card) {
      card.addEventListener("click", function () {
        openTicketDetail(card);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openTicketDetail(card);
        }
      });
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
    });
  }

  if (ticketBack) ticketBack.addEventListener("click", closeTicketDetail);
  if (ticketClose) ticketClose.addEventListener("click", closeTicketDetail);
  if (ticketDetail) {
    ticketDetail.addEventListener("click", function (e) {
      if (e.target === ticketDetail) closeTicketDetail();
    });
  }

  /* ---- the day, as an orbit ------------------------------------------ */
  const RINGS = [
    {
      name: "Speakers",
      r: 0.24,
      tilt: 0.32,
      nodes: [
        { label: "Kent C. Dodds", sub: "Keynote", filled: true },
        { label: "Second keynote", sub: "Soon", filled: false },
        { label: "Devin", sub: "Closing", filled: false }
      ]
    },
    {
      name: "Topics",
      r: 0.4,
      tilt: 0.34,
      nodes: [
        { label: "Agents", sub: "The future", filled: true },
        { label: "AI", sub: "The new medium", filled: true },
        { label: "Systems", sub: "Think in loops", filled: true },
        { label: "Teams", sub: "Build together", filled: true },
        { label: "Craft", sub: "Make it good", filled: true }
      ]
    },
    {
      name: "VanSpace",
      r: 0.58,
      tilt: 0.36,
      nodes: [
        { label: "Science World", sub: "Vancouver", filled: true },
        { label: "Community", sub: "One room", filled: true },
        { label: "Builders", sub: "Single track", filled: true }
      ]
    }
  ];

  const nodes = [];
  RINGS.forEach(function (ring, ri) {
    ring.nodes.forEach(function (n, ni) {
      nodes.push({
        ring: ri,
        r: ring.r,
        tilt: ring.tilt,
        a: (ni / ring.nodes.length) * Math.PI * 2 + ri * 0.7,
        label: n.label,
        sub: n.sub,
        filled: n.filled,
        size: n.filled ? 0.9 : 0.6
      });
    });
  });

  /* ---- dither the sketch --------------------------------------------- */
  let parts = [];
  let ready = false;
  let img = null;
  let particleRevealStartedAt = 0;
  let plateAspect = 1;
  let meteors = [];

  function ditherToParticles() {
    const TW = window.innerWidth < 760 ? 340 : 460;
    const TH = Math.round((TW * img.naturalHeight) / img.naturalWidth);
    plateAspect = TH / TW;

    const off = document.createElement("canvas");
    off.width = TW;
    off.height = TH;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(img, 0, 0, TW, TH);
    const src = octx.getImageData(0, 0, TW, TH).data;

    // grayscale + gamma so pencil midtones survive a 1-bit threshold
    const g = new Float32Array(TW * TH);
    for (let i = 0; i < TW * TH; i++) {
      const j = i * 4;
      const lum = (src[j] * 0.299 + src[j + 1] * 0.587 + src[j + 2] * 0.114) / 255;
      g[i] = Math.pow(Math.min(1, Math.max(0, (lum - 0.06) / 0.9)), 2.4) * 255;
    }

    // Floyd-Steinberg
    const dark = [];
    for (let y = 0; y < TH; y++) {
      for (let x = 0; x < TW; x++) {
        const i = y * TW + x;
        const old = g[i];
        const nv = old < 128 ? 0 : 255;
        g[i] = nv;
        const err = old - nv;
        if (x + 1 < TW) g[i + 1] += (err * 7) / 16;
        if (y + 1 < TH) {
          if (x > 0) g[i + TW - 1] += (err * 3) / 16;
          g[i + TW] += (err * 5) / 16;
          if (x + 1 < TW) g[i + TW + 1] += (err * 1) / 16;
        }
        if (nv === 0) dark.push([x / TW - 0.5, y / TH - 0.5]);
      }
    }

    const want = window.innerWidth < 760 ? 3200 : 5000;
    const stride = Math.max(1, Math.floor(dark.length / want));
    parts = [];
    for (let i = 0; i < dark.length; i += stride) {
      const p = dark[i];
      const roll = Math.random();
      let role, node = 0, ringIdx = 0, ang = 0, rad = 0;
      if (roll < 0.36) {
        role = "node";
        node = (Math.random() * nodes.length) | 0;
      } else if (roll < 0.64) {
        role = "ring";
        ringIdx = (Math.random() * RINGS.length) | 0;
        ang = Math.random() * Math.PI * 2;
      } else {
        role = "dust";
        rad = 0.62 + Math.random() * 0.9;
        ang = Math.random() * Math.PI * 2;
      }
      parts.push({
        sx: p[0], sy: p[1],
        role: role, node: node, ringIdx: ringIdx, ang: ang, rad: rad,
        jr: Math.pow(Math.random(), 0.6),
        ja: Math.random() * Math.PI * 2,
        delay: Math.random() * 0.3 + (p[0] + 0.5) * 0.16,
        bob: Math.random() * Math.PI * 2
      });
    }
    ready = true;
  }

  /* ---- canvas plumbing ------------------------------------------------ */
  let W = 0, H = 0, plateAnchorX = 0, plateAnchorY = 0;
  let posterFrameW = 0, posterFrameH = 0;
  function updatePlateAnchor() {
    if (!posterFrame) return;
    const canvasRect = canvas.getBoundingClientRect();
    const frameRect = posterFrame.getBoundingClientRect();
    plateAnchorX = frameRect.left + frameRect.width / 2 - canvasRect.left;
    plateAnchorY = frameRect.top + frameRect.height / 2 - canvasRect.top;
    posterFrameW = frameRect.width;
    posterFrameH = frameRect.height;
  }

  function resetMeteors() {
    const count = W < 720 ? 3 : 6;
    meteors = [];
    for (let i = 0; i < count; i++) {
      meteors.push({
        offset: i / count,
        speed: 0.052,
        y: 0.06 + Math.random() * 0.48,
        length: 42 + Math.random() * 68
      });
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updatePlateAnchor();
    resetMeteors();
  }

  function progress() {
    const rect = stage.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -rect.top / total));
  }

  const lerp = function (a, b, t) { return a + (b - a) * t; };
  const ease = function (t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); };
  function rgb(c1, c2, t) {
    return "rgb(" + Math.round(lerp(c1[0], c2[0], t)) + "," +
      Math.round(lerp(c1[1], c2[1], t)) + "," +
      Math.round(lerp(c1[2], c2[2], t)) + ")";
  }
  function project(rad, ang, tilt, cx, cy, scale) {
    return [
      cx + Math.cos(ang) * rad * scale,
      cy + Math.sin(ang) * rad * scale * tilt,
      (Math.sin(ang) + 1) / 2
    ];
  }

  function drawMeteors(now, visibility) {
    if (visibility <= 0.02) return;
    const seconds = now * 0.001;
    for (let i = 0; i < meteors.length; i++) {
      const meteor = meteors[i];
      const cycle = (seconds * meteor.speed + meteor.offset) % 1;
      if (cycle > 0.21) continue;
      const travel = cycle / 0.21;
      const x = lerp(W + meteor.length, -meteor.length, travel);
      const y = meteor.y * H + travel * H * 0.34;
      const tailX = x + meteor.length;
      const tailY = y - meteor.length * 0.32;
      const gradient = ctx.createLinearGradient(x, y, tailX, tailY);
      gradient.addColorStop(0, "rgba(229,224,207," + (0.9 * visibility) + ")");
      gradient.addColorStop(1, "rgba(229,224,207,0)");
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(229,224,207," + visibility + ")";
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  /* ---- rotation / click to collapse ----------------------------------- */
  let rot = 0;
  let warping = false, warpStart = 0, warp = 0, warpNavigated = false;
  let transitionCovering = false;

  function triggerWormhole() {
    const afterHero = document.getElementById("schedule") || document.getElementById("film");
    if (reduce) {
      if (afterHero) afterHero.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    /* need the solar system on stage (BIOS finished + formed enough) */
    if (warping || !bsodDone || orbitForm < 0.35) return;
    warping = true;
    warpStart = performance.now();
    warpNavigated = false;
    transitionCovering = false;
    if (transition) transition.classList.remove("is-covering", "is-revealing");
    stage.classList.add("is-warping");
    canvas.setAttribute("aria-pressed", "true");
  }

  /* ---- frame ----------------------------------------------------------- */
  let p = 0;
  function frame(now) {
    if (W !== canvas.clientWidth || H !== canvas.clientHeight) resize();
    p = progress();
    if (p < 0.2) updatePlateAnchor();
    if (warping) {
      const elapsed = now - warpStart;
      warp = ease(Math.min(1, elapsed / 1050));
      if (elapsed > 760 && transition && !transitionCovering) {
        transitionCovering = true;
        transition.classList.add("is-covering");
      }
      if (elapsed > 1220 && !warpNavigated) {
        const afterHero = document.getElementById("schedule") || document.getElementById("film");
        warpNavigated = true;
        if (afterHero) afterHero.scrollIntoView({ behavior: "auto", block: "start" });
        if (transition) {
          transition.classList.remove("is-covering");
          transition.classList.add("is-revealing");
        }
      }
      if (elapsed > 1950) {
        warping = false;
        warp = 0;
        stage.classList.remove("is-warping");
        canvas.setAttribute("aria-pressed", "false");
        if (transition) transition.classList.remove("is-covering", "is-revealing");
      }
    }
    rot += warping ? 0.026 : 0.00032;

    /* Blue-first: land on BSOD + orbit without cream poster dwell */
    const invertScroll = ease((p - 0.06) / 0.32);
    const invert = BLUE_FIRST ? Math.max(0.98, invertScroll) : invertScroll;
    scrollVel = Math.abs(p - lastScrollP);
    lastScrollP = p;

    ctx.fillStyle = rgb(GROUND, DEEP, invert);
    ctx.fillRect(0, 0, W, H);
    if (warp > 0) {
      ctx.fillStyle = "rgba(0,0,26," + (warp * 0.42) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    /* ---- Simple phases: boot → intro → speakers → day ---- */
    const sinceDone = bsodDone ? (now - bsodDoneAt) / 1000 : 0;
    /* Give the boot a breath, then ease the particles into their orbit. */
    const bootOrbit = ease((sinceDone - 0.28) / 1.8);
    const scrollOrbit = ease((p - 0.08) / 0.55);
    const form = bsodDone ? Math.max(bootOrbit, scrollOrbit) : 0;
    orbitForm = form;

    /* chapter progress = linear scroll after boot (no ease — easier to land in bands) */
    const chapterP = bsodDone ? Math.min(1, Math.max(0, p)) : 0;

    /*
     * Sequential phases: venue → sponsors → schedule + speakers.
     * The left console and right window change together at each stop.
     */
    const introHeld = phase !== "intro" || (introAt && now - introAt > 1600);
    if (!warping && bsodDone && introHeld) {
      if (phase === "intro" && chapterP >= SPEAKERS_AT) {
        setPhase("speakers", now);
      } else if (phase === "speakers" && chapterP >= SPONSORS_AT) {
        setPhase("sponsors", now);
      } else if (phase === "sponsors" && chapterP < SPONSORS_AT) {
        setPhase("speakers", now);
      } else if (phase === "speakers" && chapterP < SPEAKERS_AT) {
        setPhase("intro", now);
      }
    }

    const venueOn = phase === "intro";
    const sponsorOn = phase === "sponsors";
    const speakerOn = phase === "speakers";
    const sponsorReveal = sponsorOn ? 1 : 0;
    const speakerReveal = speakerOn ? 1 : 0;
    /* Keep the particle field visible from the initial BIOS boot onward. */
    const orbitFade = 1;
    const particleReveal = particleRevealStartedAt
      ? ease((now - particleRevealStartedAt) / 1.1)
      : 0;

    const bootActive = invert > 0.5 && !warping;
    if (bsodEl && bsodText && !reduce) {
      /* type boot, then manifesto, then module scripts */
      const target = phase === "boot" ? phaseTarget() : consoleTarget;
      const targetLen = target.length;

      if (phase === "boot" && bootActive && consoleTyped < targetLen) {
        const speed = Math.max(1, 7 - scrollVel * 500);
        const burst = Math.max(2, Math.min(28, 3 + Math.floor(scrollVel * 80)));
        if (!consoleLastTick) consoleLastTick = now;
        while (consoleTyped < targetLen && now - consoleLastTick > speed) {
          consoleTyped = Math.min(targetLen, consoleTyped + burst);
          consoleLastTick += speed;
        }
        if (consoleTyped >= targetLen) {
          bsodDone = true;
          bsodDoneAt = now;
          setPhase("intro", now);
        }
        bsodText.textContent = target.slice(0, consoleTyped);
      } else if (phase === "sponsors" || phase === "speakers") {
        if (bootActive && consoleTyped < targetLen) {
          const speed = Math.max(1, 6 - scrollVel * 400);
          const burst = Math.max(2, Math.min(32, 4 + Math.floor(scrollVel * 100)));
          if (!consoleLastTick) consoleLastTick = now;
          while (consoleTyped < targetLen && now - consoleLastTick > speed) {
            consoleTyped = Math.min(targetLen, consoleTyped + burst);
            consoleLastTick += speed;
          }
        }
        if (consoleTyped > targetLen) consoleTyped = targetLen;
        bsodText.textContent = target.slice(0, consoleTyped);
      }

      const splitDesktop = W >= 900;
      const exitGlitch = warping && warp > 0.02;
      const bsodVisible =
        (invert > 0.48 && (bootActive || bsodDone) && !warping) || exitGlitch;

      bsodEl.classList.toggle("is-on", bsodVisible);
      bsodEl.classList.toggle(
        "is-split",
        splitDesktop && bsodVisible && !exitGlitch && (BLUE_FIRST || bsodDone)
      );
      bsodEl.classList.toggle("is-fading", exitGlitch && warp > 0.55);
      bsodEl.classList.toggle("is-glitch", exitGlitch);
      if (biosChrome) {
        biosChrome.classList.toggle("is-on", bsodVisible && !exitGlitch);
        biosChrome.setAttribute(
          "aria-hidden",
          bsodVisible && !exitGlitch ? "false" : "true"
        );
      }
      if (biosNav) {
        const showNav = bsodVisible && !exitGlitch && phase !== "boot";
        biosNav.classList.toggle("is-on", showNav);
        if (showNav) biosNav.removeAttribute("hidden");
        else biosNav.setAttribute("hidden", "");
      }
      bsodEl.classList.toggle(
        "is-speakers-yield",
        (venueOn || sponsorOn || speakerOn) && W < 900 && !exitGlitch
      );
      bsodEl.setAttribute("aria-hidden", bsodVisible ? "false" : "true");

      if (
        bsodVisible &&
        phase !== "intro" &&
        bsodEl.scrollHeight > bsodEl.clientHeight
      ) {
        bsodEl.scrollTop = bsodEl.scrollHeight;
      }

      if (navEl) {
        const hideNav = BLUE_FIRST
          ? !exitGlitch && p < 0.98
          : bsodVisible && !exitGlitch && invert > 0.55;
        navEl.classList.toggle("is-bsod-hidden", hideNav);
        if (exitGlitch) navEl.classList.remove("is-bsod-hidden");
      }
    }

    /* Desktop split: BIOS 35% | solar 65% (center of right column) */
    const split =
      W >= 900 &&
      invert > 0.5 &&
      !warping &&
      (BLUE_FIRST || bsodDone);
    const cx = split ? W * 0.675 : W / 2;
    const cy = H / 2;
    const scale = split
      ? Math.min(W * 0.58, H) * 0.72
      : Math.min(W, H) * 0.66;

    if (hermesOrbit && form > 0) {
      const ring = RINGS[1];
      const hpr = project(ring.r * scale, rot + now * 0.0005, ring.tilt, cx, cy, scale);
      hermesOrbit.style.left = hpr[0] + "px";
      hermesOrbit.style.top = hpr[1] + "px";
    }

    const widePoster = W >= 900;
    const plateW = widePoster
      ? Math.min(W * 0.52, 840)
      : Math.min(W * 1.08, (posterFrameW || W * 0.82) * 1.25);
    const plateH = plateW * plateAspect;
    const plateCx = plateAnchorX || (widePoster ? W * 0.7 : W / 2);
    const plateCy = plateAnchorY || (widePoster ? H * 0.5 : cy);
    const warpScale = Math.max(0.002, Math.pow(1 - warp, 2.2));
    const activeRing = Math.min(
      RINGS.length - 1,
      Math.max(0, Math.floor(form * 3.2))
    );

    drawMeteors(now, form * orbitFade * particleReveal * ease((invert - 0.62) / 0.38) * (1 - warp));

    // orbit paths — only after BIOS done
    RINGS.forEach(function (ring, ri) {
      const rv = ease((form - ri * 0.12) / 0.28);
      if (rv <= 0) return;
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        ring.r * scale * warpScale,
        ring.r * scale * ring.tilt * warpScale,
        warp * 5.5,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = "rgba(229,224,207," + (0.2 * rv * orbitFade * particleReveal * (1 - warp)) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (ri === activeRing && W >= 720 && form > 0.35) {
        ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = "rgba(229,224,207," + (0.8 * rv * orbitFade * particleReveal) + ")";
        ctx.textAlign = "right";
        const labelX = Math.max(
          split ? W * 0.36 : 8,
          cx - ring.r * scale - 10
        );
        ctx.fillText(ring.name.toUpperCase(), labelX, cy + 3);
        ctx.textAlign = "left";
      }
    });

    /* Cognition sun — hide when speakers panel owns the right stage */
    if (cogSun) {
      const showCog = sponsorReveal > 0.2 && warp < 0.55;
      cogSun.classList.toggle("is-on", showCog);
      cogSun.classList.toggle("is-split", split);
      cogSun.classList.toggle("is-warping", warp > 0.2 || speakerReveal > 0.2);
      cogSun.setAttribute("aria-hidden", showCog ? "false" : "true");
    }

    /* Right: venue, sponsors, then schedule + speakers */
    const baseStage = !warping && invert > 0.5 && (W >= 900 ? form > 0.85 : true);
    if (speakersPanel) {
      const showSpeakers = baseStage && speakerReveal > 0.08;
      speakersPanel.classList.toggle("is-on", showSpeakers);
      speakersPanel.setAttribute("aria-hidden", showSpeakers ? "false" : "true");
    }
    if (sponsorPanel) {
      const showSponsors = baseStage && (W >= 900 || sponsorReveal > 0.08);
      sponsorPanel.classList.toggle("is-on", showSponsors);
      sponsorPanel.setAttribute("aria-hidden", showSponsors ? "false" : "true");
    }
    if (venuePanel) {
      const showVenue = baseStage && venueOn;
      venuePanel.classList.toggle("is-on", showVenue);
      venuePanel.setAttribute("aria-hidden", showVenue ? "false" : "true");
    }

    // particles
    const cr = lerp(INK_BLUE[0], GROUND[0], invert);
    const cg = lerp(INK_BLUE[1], GROUND[1], invert);
    const cb = lerp(INK_BLUE[2], GROUND[2], invert);
    const colorHead = "rgba(" + Math.round(cr) + "," + Math.round(cg) + "," + Math.round(cb) + ",";

    const openingParticleSize = W < 720 ? 0.68 : 0.78;
    for (let i = 0; i < parts.length; i++) {
      const pt = parts[i];
      /* stay on poster until BIOS finishes, then form drives scatter */
      const t = form > 0
        ? ease(Math.min(1, (form - pt.delay * 0.55) / 0.72))
        : 0;
      let tx, ty, depth = 0.6;

      if (pt.role === "node") {
        const n = nodes[pt.node];
        const pr = project(n.r, n.a + rot, n.tilt, cx, cy, scale);
        const rr = pt.jr * 0.032 * scale * n.size;
        tx = pr[0] + Math.cos(pt.ja) * rr;
        ty = pr[1] + Math.sin(pt.ja) * rr;
        depth = pr[2];
      } else if (pt.role === "ring") {
        const ring = RINGS[pt.ringIdx];
        const pr = project(ring.r, pt.ang + rot * 0.6, ring.tilt, cx, cy, scale);
        tx = pr[0]; ty = pr[1]; depth = pr[2];
      } else {
        const pr = project(pt.rad, pt.ang + rot * 0.14, 0.6, cx, cy, scale);
        tx = pr[0]; ty = pr[1] + Math.sin(pt.bob) * 4; depth = pr[2];
      }

      let x = lerp(plateCx + pt.sx * plateW, tx, t);
      let y = lerp(plateCy + pt.sy * plateH, ty, t);

      if (warp > 0) {
        const dx = x - cx;
        const dy = y - cy;
        const radius = Math.hypot(dx, dy) * warpScale;
        const angle = Math.atan2(dy, dx) + warp * (8 + pt.jr * 4);
        x = cx + Math.cos(angle) * radius;
        y = cy + Math.sin(angle) * radius;
      }

      let alpha, size;
      if (t < 0.02) { alpha = 0.9; size = openingParticleSize; }
      else {
        const vis = pt.role === "dust" ? 0.3 : 0.4 + depth * 0.5;
        alpha = lerp(0.9, vis, t);
        size = lerp(
          openingParticleSize,
          pt.role === "node" ? 0.82 + depth * 0.38 : 0.66,
          t
        );
      }
      if (pt.role !== "dust") {
        const ri = pt.role === "node" ? nodes[pt.node].ring : pt.ringIdx;
        const rv = ease((form - ri * 0.12) / 0.28);
        alpha *= lerp(1, Math.max(0.15, rv), ease(form));
      }

      alpha *= orbitFade * particleReveal;
      ctx.fillStyle = colorHead + alpha.toFixed(3) + ")";
      ctx.fillRect(x, y, size * (1 + warp * 1.4), size * (1 + warp * 1.4));
    }

    // node labels, revealed ring by ring after form
    if (form > 0.28) {
      ctx.textAlign = "center";
      const labelMinX = split ? W * 0.35 + 8 : 12;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.ring !== activeRing) continue;
        const rv = ease((form - (0.28 + n.ring * 0.1)) / 0.22);
        if (rv <= 0.02) continue;
        const angle = n.a + rot;
        const pr = project(n.r, angle, n.tilt, cx, cy, scale);
        const horizontal = Math.cos(angle) >= 0 ? 1 : -1;
        const vertical = pr[2] >= 0.5 ? 1 : -1;
        const offsetX = (W < 720 ? 14 : 20) * horizontal;
        const offsetY = (W < 720 ? 18 : 24) * vertical;
        let x = Math.min(W - 12, Math.max(labelMinX, pr[0] + offsetX));
        const y = Math.min(H - 26, Math.max(26, pr[1] + offsetY));
        const a = rv * (0.76 + pr[2] * 0.24) * (1 - warp) * orbitFade * particleReveal;
        ctx.font = n.filled
          ? '500 12px "IBM Plex Mono", ui-monospace, monospace'
          : '400 9px "IBM Plex Mono", ui-monospace, monospace';
        const mainWidth = ctx.measureText(n.filled ? n.label : n.sub.toUpperCase()).width;
        const subWidth = n.filled
          ? ctx.measureText(n.sub.toUpperCase()).width
          : 0;
        const labelWidth = Math.max(mainWidth, subWidth);
        if (horizontal > 0 && x + labelWidth > W - 10) x = W - labelWidth - 10;
        if (horizontal < 0 && x - labelWidth < labelMinX) x = labelMinX + labelWidth;
        ctx.beginPath();
        ctx.moveTo(pr[0], pr[1]);
        ctx.lineTo(x - horizontal * 4, y - vertical * 3);
        ctx.strokeStyle = "rgba(229,224,207," + (a * 0.45) + ")";
        ctx.stroke();
        ctx.textAlign = horizontal > 0 ? "left" : "right";
        if (n.filled) {
          ctx.font = '500 12px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = "rgba(229,224,207," + a + ")";
          ctx.fillText(n.label, x, y);
          ctx.font = '400 9px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = "rgba(229,224,207," + a * 0.62 + ")";
          ctx.fillText(n.sub.toUpperCase(), x, y + vertical * 14);
        } else {
          ctx.font = '400 9px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = "rgba(229,224,207," + a * 0.72 + ")";
          ctx.fillText(n.sub.toUpperCase(), x, y);
        }
      }
      ctx.textAlign = "left";
    }

    if (warp > 0) {
      const core = 3 + warp * Math.min(W, H) * 0.055;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, core * 2.8);
      glow.addColorStop(0, "rgba(0,0,12,1)");
      glow.addColorStop(0.35, "rgba(0,0,28,0.96)");
      glow.addColorStop(0.68, "rgba(229,224,207," + (0.38 * warp) + ")");
      glow.addColorStop(1, "rgba(229,224,207,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, core * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(229,224,207," + (0.82 * warp) + ")";
      ctx.lineWidth = 1;
      for (let ring = 1; ring <= 3; ring++) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, core * (1 + ring * 0.42), core * (0.28 + ring * 0.1), warp * 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (heroCopy) {
      heroCopy.classList.toggle("is-out", BLUE_FIRST || p > 0.2);
      if (BLUE_FIRST) {
        heroCopy.setAttribute("aria-hidden", "true");
        heroCopy.style.display = "none";
      }
    }
    if (flagship) flagship.classList.toggle("is-inverted", p > 0.22);
    if (legend) {
      legend.classList.toggle(
        "is-in",
        form > 0.55 && sponsorReveal < 0.12 && speakerReveal < 0.12
      );
      legend.classList.toggle("is-split", split);
    }
    if (readout && form > 0.55) {
      readout.textContent = RINGS[activeRing].name;
    }

    requestAnimationFrame(frame);
  }

  function staticFallback() {
    resize();
    ctx.fillStyle = "rgb(229,224,207)";
    ctx.fillRect(0, 0, W, H);
    const dw = Math.min(W * 0.82, 940);
    const dh = dw * (img.naturalHeight / img.naturalWidth);
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  img = new Image();
  img.decoding = "async";
  img.onload = function () {
    resize();
    if (reduce) {
      stage.classList.add("is-static");
      staticFallback();
      window.addEventListener("resize", staticFallback);
      return;
    }
    ditherToParticles();
    particleRevealStartedAt = performance.now();
    window.addEventListener("resize", function () {
      resize();
      ditherToParticles();
    });
    /* blue-first: start at top so we don't land mid-stage on speakers */
    if (BLUE_FIRST) {
      if (window.scrollY > 8) window.scrollTo(0, 0);
      if (navEl) navEl.classList.add("is-bsod-hidden");
    }
    requestAnimationFrame(frame);
  };
  img.onerror = function () { stage.classList.add("is-static"); };
  img.src = canvas.dataset.src || "/science-world-aug11-blue.png";
})();
