/**
 * VanSpace hero: dithered Space Centre saucer -> orbit map of the day.
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
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GROUND = [229, 224, 207]; // --ground
  const DEEP = [6, 0, 168]; // --deep
  const INK_BLUE = [6, 0, 168]; // --ink-blue

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
        { label: "Build with Devin", sub: "Workshop", filled: true },
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
        { label: "Lunch + tables", sub: "12:10", filled: true },
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
    const speakers = document.getElementById("speakers");
    if (reduce) {
      if (speakers) speakers.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }
    if (p <= 0.42 || warping) return;
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
        const speakers = document.getElementById("speakers");
        warpNavigated = true;
        if (speakers) speakers.scrollIntoView({ behavior: "auto", block: "start" });
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
    ctx.fillStyle = rgb(GROUND, DEEP, invert);
    ctx.fillRect(0, 0, W, H);
    if (warp > 0) {
      ctx.fillStyle = "rgba(0,0,26," + (warp * 0.42) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    const cx = W / 2, cy = H / 2;
    const scale = Math.min(W, H) * 0.66;
    const widePoster = W >= 900;
    const plateW = widePoster
      ? Math.min(W * 0.52, 840)
      : Math.min(W * 1.08, (posterFrameW || W * 0.82) * 1.25);
    const plateH = plateW * plateAspect;
    const plateCx = plateAnchorX || (widePoster ? W * 0.7 : cx);
    const plateCy = plateAnchorY || (widePoster ? H * 0.5 : cy);
    const warpScale = Math.max(0.002, Math.pow(1 - warp, 2.2));
    const activeRing = Math.min(
      RINGS.length - 1,
      Math.max(0, Math.floor((p - 0.46) / 0.1))
    );

    drawMeteors(now, ease((invert - 0.62) / 0.38) * (1 - warp));

    // orbit paths
    RINGS.forEach(function (ring, ri) {
      const rv = ease((p - (0.42 + ri * 0.1)) / 0.1);
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
      ctx.strokeStyle = "rgba(229,224,207," + (0.2 * rv * (1 - warp)) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
      if (ri === activeRing && W >= 720) {
        ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = "rgba(229,224,207," + (0.8 * rv) + ")";
        ctx.textAlign = "right";
        ctx.fillText(ring.name.toUpperCase(), Math.max(8, cx - ring.r * scale - 10), cy + 3);
        ctx.textAlign = "left";
      }
    });

    // particles
    const cr = lerp(INK_BLUE[0], GROUND[0], invert);
    const cg = lerp(INK_BLUE[1], GROUND[1], invert);
    const cb = lerp(INK_BLUE[2], GROUND[2], invert);
    const colorHead = "rgba(" + Math.round(cr) + "," + Math.round(cg) + "," + Math.round(cb) + ",";

    const openingParticleSize = W < 720 ? 0.68 : 0.78;
    for (let i = 0; i < parts.length; i++) {
      const pt = parts[i];
      const t = ease((p - pt.delay * 0.5) / 0.4);
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
        const rv = ease((p - (0.42 + ri * 0.1)) / 0.1);
        alpha *= lerp(1, rv, ease((p - 0.4) / 0.14));
      }

      ctx.fillStyle = colorHead + alpha.toFixed(3) + ")";
      ctx.fillRect(x, y, size * (1 + warp * 1.4), size * (1 + warp * 1.4));
    }

    // node labels, revealed ring by ring so they never pile up
    if (p > 0.46) {
      ctx.textAlign = "center";
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.ring !== activeRing) continue;
        const rv = ease((p - (0.46 + n.ring * 0.1)) / 0.1);
        if (rv <= 0.02) continue;
        const angle = n.a + rot;
        const pr = project(n.r, angle, n.tilt, cx, cy, scale);
        const horizontal = Math.cos(angle) >= 0 ? 1 : -1;
        const vertical = pr[2] >= 0.5 ? 1 : -1;
        const offsetX = (W < 720 ? 14 : 20) * horizontal;
        const offsetY = (W < 720 ? 18 : 24) * vertical;
        let x = Math.min(W - 12, Math.max(12, pr[0] + offsetX));
        const y = Math.min(H - 26, Math.max(26, pr[1] + offsetY));
        const a = rv * (0.76 + pr[2] * 0.24) * (1 - warp);
        ctx.font = n.filled
          ? '500 12px "IBM Plex Mono", ui-monospace, monospace'
          : '400 9px "IBM Plex Mono", ui-monospace, monospace';
        const mainWidth = ctx.measureText(n.filled ? n.label : n.sub.toUpperCase()).width;
        const subWidth = n.filled
          ? ctx.measureText(n.sub.toUpperCase()).width
          : 0;
        const labelWidth = Math.max(mainWidth, subWidth);
        if (horizontal > 0 && x + labelWidth > W - 10) x = W - labelWidth - 10;
        if (horizontal < 0 && x - labelWidth < 10) x = labelWidth + 10;
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
    if (legend) legend.classList.toggle("is-in", p > 0.42);
    if (readout && p > 0.42) {
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
  img.src = canvas.dataset.src || "./space-centre-sketch.jpg";
})();
