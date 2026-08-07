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
  const speakersPanel = document.getElementById("orbit-speakers");
  const venuePanel = document.getElementById("orbit-venue");
  const biosChrome = document.getElementById("orbit-bios-chrome");
  const statusEl = document.getElementById("orbit-status");
  let lastAnnouncedChapter = "";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GROUND = [229, 224, 207]; // --ground
  /* Classic-ish BSOD blue (not pure #00f — readable with cream particles) */
  const DEEP = [0, 0, 170]; // #0000AA
  const INK_BLUE = [0, 0, 170];

  /* ---- Console: BIOS boot, then scroll unlocks more load chapters ---- */
  const bsodEl = document.getElementById("orbit-bsod");
  const bsodText = document.getElementById("orbit-bsod-text");
  const navEl = document.querySelector(".nav");

  /* Phase 0 — short boot (sponsors + core systems) */
  const BOOT_SCRIPT = [
    "VanSpace BIOS (C) 2026",
    "",
    "C:\\VANSPACE> boot programme.exe",
    "Loading micro-conference...",
    "  cognition.......... OK",
    "  keynotes........... OK",
    "  single track....... OK",
    "  Science World...... OK",
    "  10 Nov 2026........ OK",
    "  13:00–19:00........ OK",
    "  ticket gravity..... OK",
    "  loading devin...... OK",
    "",
    "A problem has been detected and Windows has been",
    "shut down to prevent damage to your weekend.",
    "",
    "VANSPACE_MICRO_CONFERENCE",
    "",
    "*** STOP: 0xVANSPACE (KENT, WES, CLOSING, 0x96)",
    "",
    "Keep scrolling — modules load as you go_"
  ].join("\n");

  /* After boot: each chapter appends as scroll/form crosses a threshold */
  const LOAD_CHAPTERS = [
    {
      id: "orbit",
      formAt: 0.02,
      label: "Programme map loaded",
      lines: [
        "",
        "C:\\VANSPACE> load orbit.exe",
        "Loading programme map...",
        "  ring:keynotes...... OK",
        "  ring:sessions...... OK",
        "  ring:the-room...... OK",
        "  cognition core..... ONLINE"
      ]
    },
    {
      id: "speakers",
      /* wide band so the line-up can be scrolled / read */
      formAt: 0.45,
      label: "Speakers module loaded",
      lines: [
        "",
        "C:\\VANSPACE> load speakers.exe",
        "Loading speakers...",
        "  Kent C. Dodds...... OK",
        "  Wes Bos............ OK",
        "  closing speaker.... PENDING",
        "  sessions[0..4]..... TBA"
      ]
    },
    {
      /* Merged right panel: Science World + tickets + Cognition/Devin.
         Left console clears to Devin CLI + schedule. */
      id: "day",
      formAt: 0.72,
      label: "Day loaded — Science World, tickets, Devin schedule",
      lines: [
        "",
        "C:\\VANSPACE> cls",
        "C:\\VANSPACE> load devin.exe",
        "Loading Devin...",
        "  cognition.......... OK",
        "  cli................ OK",
        "  schedule bridge.... OK",
        "",
        "C:\\VANSPACE> devin",
        "",
        "⠀⣴⣾⣶⡄⠀⠀⠀⠀",
        "⠀⠛⠿⠟⠻⣶⣾⣶⡄  Devin CLI",
        "⠀⣤⣶⣦⣴⠿⢿⠿⠃  v3000.2.17 · Max",
        "⠀⠻⢿⠿⠃⠀⠀⠀⠀",
        "",
        "  presented with Cognition",
        "  vanspace · 10 Nov 2026",
        "",
        "C:\\VANSPACE> load schedule.exe",
        "Loading agenda · 13:00–19:00",
        "",
        "  13:00  Doors · coffee · tables",
        "  13:15  Welcome · CoC · wifi",
        "  13:30  Keynote 1 · Kent C. Dodds",
        "  14:15  Session 1",
        "  14:45  Session 2",
        "  15:15  Break · hallway",
        "  15:35  Keynote 2 · Wes Bos",
        "  16:20  Session 3",
        "  16:55  Closing speaker · TBA",
        "  17:40  Hang · tables",
        "  19:00  Programme ends",
        "",
        "  early bird......... $99 · first 50",
        "  student............ $99",
        "  standard........... $160",
        "",
        "SWE-1.7 Max · /help"
      ]
    }
  ];

  let consoleTyped = 0;
  let consoleLastTick = 0;
  let bsodDone = false;
  let bsodDoneAt = 0;
  let lastScrollP = 0;
  let scrollVel = 0;
  let orbitForm = 0;
  /* console focus: boot → speakers wipe → day (Devin + schedule only) */
  let consoleFocusFrom = null;
  let lastConsoleMode = "boot";

  const SPEAKERS_CHAPTER = LOAD_CHAPTERS.find(function (c) {
    return c.id === "speakers";
  });
  const DAY_CHAPTER = LOAD_CHAPTERS.find(function (c) {
    return c.id === "day";
  });
  const SPEAKERS_AT = SPEAKERS_CHAPTER ? SPEAKERS_CHAPTER.formAt : 0.45;
  const DAY_AT = DAY_CHAPTER ? DAY_CHAPTER.formAt : 0.72;

  /* chapterP: scroll-driven after boot — orbit dwells long before speakers */
  function chapterProgress(p, form, sinceDoneSec) {
    if (!bsodDone) return 0;
    const byScroll = ease(Math.max(0, (p - 0.22) / 0.72));
    const byForm = form * 0.28;
    const byTime = Math.min(0.12, sinceDoneSec / 14);
    return Math.min(1, Math.max(byScroll, byForm, byTime));
  }

  function buildConsoleTarget(chapterP) {
    /* Day beat: only Devin CLI + schedule — everything else gone */
    if (consoleFocusFrom === "day") {
      const ch = DAY_CHAPTER;
      if (!ch) return "";
      return ch.lines.join("\n").replace(/^\n+/, "");
    }

    /* Speakers beat: short speakers dump (no boot crash noise) */
    if (consoleFocusFrom === "speakers") {
      const head = [
        "VanSpace console",
        "C:\\VANSPACE> cls",
        "  (boot log cleared)",
        ""
      ].join("\n");
      const ch = SPEAKERS_CHAPTER;
      return head + (ch ? "\n" + ch.lines.join("\n") : "");
    }

    let out = BOOT_SCRIPT;
    for (let i = 0; i < LOAD_CHAPTERS.length; i++) {
      const ch = LOAD_CHAPTERS[i];
      if (ch.id === "speakers") break;
      if (chapterP >= ch.formAt) {
        out += "\n" + ch.lines.join("\n");
      }
    }
    return out;
  }

  /* ---- the day, as an orbit ------------------------------------------ */
  const RINGS = [
    {
      name: "Keynotes",
      r: 0.24,
      tilt: 0.32,
      nodes: [
        { label: "Kent C. Dodds", sub: "Keynote", filled: true },
        { label: "Wes Bos", sub: "Keynote", filled: true },
        { label: "Closing speaker", sub: "TBA", filled: false }
      ]
    },
    {
      name: "Sessions",
      r: 0.4,
      tilt: 0.34,
      nodes: [
        { label: "Session", sub: "Announcing soon", filled: false },
        { label: "Session", sub: "Announcing soon", filled: false },
        { label: "Session", sub: "Announcing soon", filled: false },
        { label: "Session", sub: "Announcing soon", filled: false },
        { label: "Session", sub: "Announcing soon", filled: false }
      ]
    },
    {
      name: "The room",
      r: 0.58,
      tilt: 0.36,
      nodes: [
        { label: "Break · tables", sub: "15:15", filled: true },
        { label: "Sponsor tables", sub: "All day", filled: true },
        { label: "Hallway", sub: "Where it happens", filled: true }
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

  /* ---- drag to rotate / click to collapse ----------------------------- */
  let rot = 0, vel = 0, dragging = false, lastX = 0;
  let pointerStartX = 0, pointerStartY = 0, pointerMoved = false;
  let pointerDownAt = 0;
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

  canvas.addEventListener("pointerdown", function (e) {
    if (warping) return;
    dragging = true;
    pointerMoved = false;
    pointerDownAt = performance.now();
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    lastX = e.clientX;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    if (Math.hypot(e.clientX - pointerStartX, e.clientY - pointerStartY) > 7) {
      pointerMoved = true;
    }
    lastX = e.clientX;
    rot += dx * 0.006;
    vel = dx * 0.006;
  });
  canvas.addEventListener("pointerup", function () {
    dragging = false;
  });
  canvas.addEventListener("click", function (e) {
    if (pointerMoved && performance.now() - pointerDownAt < 1000) return;
    triggerWormhole();
  });
  ["pointercancel", "pointerleave"].forEach(function (ev) {
    canvas.addEventListener(ev, function () { dragging = false; });
  });
  canvas.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    triggerWormhole();
  });
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
    if (!dragging) {
      rot += (warping ? 0.026 : 0.00032) + vel;
      vel *= 0.94;
    }

    const invert = ease((p - 0.06) / 0.32);
    scrollVel = Math.abs(p - lastScrollP);
    lastScrollP = p;

    ctx.fillStyle = rgb(GROUND, DEEP, invert);
    ctx.fillRect(0, 0, W, H);
    if (warp > 0) {
      ctx.fillStyle = "rgba(0,0,26," + (warp * 0.42) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    /* ---- Console (scroll unlocks load chapters) ---- */
    const sinceDone = bsodDone ? (now - bsodDoneAt) / 1000 : 0;
    const form = bsodDone
      ? ease(Math.min(1, Math.max(sinceDone / 1.8, (p - 0.24) / 0.5)))
      : 0;
    orbitForm = form;
    const chapterP = chapterProgress(p, form, sinceDone);
    /* right-panel: speakers, then merged day (venue + tickets + cognition) */
    const speakersAt = SPEAKERS_AT;
    const dayAt = DAY_AT;
    const speakersReveal = chapterP >= speakersAt
      ? ease(Math.min(1, (chapterP - speakersAt) / 0.1))
      : 0;
    const dayReveal = chapterP >= dayAt
      ? ease(Math.min(1, (chapterP - dayAt) / 0.12))
      : 0;
    const orbitFade =
      speakersReveal > 0.15 || dayReveal > 0.1
        ? 0
        : 1 - speakersReveal * 0.98;

    /* a11y: announce chapter loads once (not every typed char) */
    if (statusEl && bsodDone && !warping) {
      let ann = "";
      for (let i = LOAD_CHAPTERS.length - 1; i >= 0; i--) {
        if (chapterP >= LOAD_CHAPTERS[i].formAt) {
          ann = LOAD_CHAPTERS[i].label || LOAD_CHAPTERS[i].id;
          break;
        }
      }
      if (ann && ann !== lastAnnouncedChapter) {
        lastAnnouncedChapter = ann;
        statusEl.textContent = ann;
      }
    }

    const bootActive = invert > 0.52 && !warping;
    if (bsodEl && bsodText && !reduce) {
      /* boot → speakers wipe → day (Devin CLI + schedule only) */
      if (chapterP >= DAY_AT && consoleFocusFrom !== "day") {
        consoleFocusFrom = "day";
        consoleTyped = 0;
        consoleLastTick = 0;
        lastConsoleMode = "day";
        if (bsodEl) bsodEl.scrollTop = 0;
      } else if (
        chapterP >= SPEAKERS_AT &&
        chapterP < DAY_AT &&
        consoleFocusFrom !== "speakers"
      ) {
        consoleFocusFrom = "speakers";
        consoleTyped = 0;
        consoleLastTick = 0;
        lastConsoleMode = "speakers";
        if (bsodEl) bsodEl.scrollTop = 0;
      } else if (chapterP < SPEAKERS_AT && consoleFocusFrom) {
        consoleFocusFrom = null;
        lastConsoleMode = "boot";
      }

      const target = buildConsoleTarget(chapterP);
      const targetLen = target.length;

      if (bootActive && consoleTyped < targetLen) {
        const speed = Math.max(1, 13 - p * 10 - scrollVel * 900);
        const burst = Math.max(
          2,
          Math.min(32, 2 + Math.floor(p * 16 + scrollVel * 140))
        );
        if (!consoleLastTick) consoleLastTick = now;
        while (consoleTyped < targetLen && now - consoleLastTick > speed) {
          consoleTyped = Math.min(targetLen, consoleTyped + burst);
          consoleLastTick += speed;
        }
        if (!bsodDone && consoleTyped >= BOOT_SCRIPT.length && !consoleFocusFrom) {
          bsodDone = true;
          bsodDoneAt = now;
        }
        /* speakers clear path still needs orbit unlocked */
        if (!bsodDone && consoleFocusFrom && consoleTyped > 8) {
          bsodDone = true;
          if (!bsodDoneAt) bsodDoneAt = now;
        }
      }
      if (consoleTyped > targetLen) consoleTyped = targetLen;

      if (bootActive || bsodDone) {
        bsodText.textContent = target.slice(0, consoleTyped);
      }

      if (invert < 0.32 && !warping) {
        consoleTyped = 0;
        consoleLastTick = 0;
        bsodDone = false;
        bsodDoneAt = 0;
        consoleFocusFrom = null;
        lastConsoleMode = "boot";
        bsodText.textContent = "";
        lastAnnouncedChapter = "";
        if (statusEl) statusEl.textContent = "";
      }

      const splitDesktop = W >= 900;
      const exitGlitch = warping && warp > 0.02;
      const bsodVisible =
        (invert > 0.48 && (bootActive || bsodDone) && !warping) ||
        exitGlitch;

      bsodEl.classList.toggle("is-on", bsodVisible);
      bsodEl.classList.toggle(
        "is-split",
        splitDesktop && bsodDone && bsodVisible && !exitGlitch
      );
      bsodEl.classList.toggle("is-fading", exitGlitch && warp > 0.55);
      bsodEl.classList.toggle("is-glitch", exitGlitch);
      /* full-window 2-line outline around entire BIOS (not only cards) */
      if (biosChrome) {
        biosChrome.classList.toggle("is-on", bsodVisible && !exitGlitch);
        biosChrome.setAttribute(
          "aria-hidden",
          bsodVisible && !exitGlitch ? "false" : "true"
        );
      }
      /* mobile: right-panel scenes own the stage; console yields */
      bsodEl.classList.toggle(
        "is-speakers-yield",
        (speakersReveal > 0.45 || dayReveal > 0.45) &&
          W < 900 &&
          !exitGlitch
      );
      bsodEl.setAttribute("aria-hidden", bsodVisible ? "false" : "true");

      if (bsodVisible && bsodEl.scrollHeight > bsodEl.clientHeight) {
        bsodEl.scrollTop = bsodEl.scrollHeight;
      }

      if (navEl) {
        navEl.classList.toggle(
          "is-bsod-hidden",
          bsodVisible && !exitGlitch && invert > 0.55
        );
        if (exitGlitch) navEl.classList.remove("is-bsod-hidden");
      }
    }

    /* Desktop split: BIOS 35% | solar 65% (center of right column) */
    const split = W >= 900 && bsodDone && invert > 0.5 && !warping;
    const cx = split ? W * 0.675 : W / 2;
    const cy = H / 2;
    const scale = split
      ? Math.min(W * 0.58, H) * 0.72
      : Math.min(W, H) * 0.66;

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

    drawMeteors(now, form * orbitFade * ease((invert - 0.62) / 0.38) * (1 - warp));

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
      ctx.strokeStyle = "rgba(229,224,207," + (0.2 * rv * orbitFade * (1 - warp)) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (ri === activeRing && W >= 720 && form > 0.35) {
        ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = "rgba(229,224,207," + (0.8 * rv * orbitFade) + ")";
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
      const showCog = form > 0.1 && warp < 0.55 && speakersReveal < 0.35;
      cogSun.classList.toggle("is-on", showCog);
      cogSun.classList.toggle("is-split", split);
      cogSun.classList.toggle("is-warping", warp > 0.2 || speakersReveal > 0.2);
      cogSun.setAttribute("aria-hidden", showCog ? "false" : "true");
    }

    /* Right: speakers, then merged day (Science World + tickets + Cognition/Devin) */
    const stageOn = !warping && invert > 0.5;
    if (speakersPanel) {
      const showSpk =
        stageOn && speakersReveal > 0.08 && dayReveal < 0.2;
      speakersPanel.classList.toggle("is-on", showSpk);
      speakersPanel.setAttribute("aria-hidden", showSpk ? "false" : "true");
    }
    if (venuePanel) {
      const showDay = stageOn && dayReveal > 0.08;
      venuePanel.classList.toggle("is-on", showDay);
      venuePanel.setAttribute("aria-hidden", showDay ? "false" : "true");
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
        ? ease(Math.min(1, (form - pt.delay * 0.35) / 0.55))
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

      alpha *= orbitFade;
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
        const a = rv * (0.76 + pr[2] * 0.24) * (1 - warp) * orbitFade;
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

    if (heroCopy) heroCopy.classList.toggle("is-out", p > 0.2);
    if (flagship) flagship.classList.toggle("is-inverted", p > 0.22);
    if (legend) {
      legend.classList.toggle(
        "is-in",
        form > 0.55 && speakersReveal < 0.12 && dayReveal < 0.12
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
    window.addEventListener("resize", function () {
      resize();
      ditherToParticles();
    });
    requestAnimationFrame(frame);
  };
  img.onerror = function () { stage.classList.add("is-static"); };
  img.src = canvas.dataset.src || "./science-world-hero.jpg";
})();
