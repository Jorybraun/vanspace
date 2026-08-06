/**
 * Interactive Space Centre → cosmos
 * States: building (sketch as particles) → scatter → cosmos (orbits)
 * Click the canvas (or the hint button) to toggle.
 * Respects prefers-reduced-motion: static image only.
 */
(function () {
  const canvas = document.getElementById("orbit-canvas");
  const hint = document.getElementById("orbit-hint");
  const stage = document.getElementById("orbit-stage");
  if (!canvas || !stage) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const imgSrc = canvas.dataset.src || "./space-centre-sketch.jpg";
  const ctx = canvas.getContext("2d", { alpha: true });

  const INK = [26, 26, 26];
  const MIST = [139, 132, 153];

  let w = 0;
  let h = 0;
  let dpr = 1;
  let particles = [];
  let state = "building"; // building | scatter | cosmos
  let animT = 0;
  let raf = 0;
  let img = null;
  let ready = false;

  // orbit bodies in cosmos mode (normalized -1..1 then scaled)
  const bodies = [
    { name: "Kent", r: 0, size: 0, size0: 0, size: 0, size: 10, color: INK },
    { name: "Flagship", r: 0.28, speed: 0.00055, phase: 0, size: 6, color: MIST },
    { name: "Fireside", r: 0.42, speed: -0.0004, phase: 1.2, size: 5, color: MIST },
    { name: "Panel", r: 0.55, speed: 0.00032, phase: 2.8, size: 5, color: MIST },
    { name: "Hallway", r: 0.68, speed: -0.00025, phase: 4.1, size: 4, color: MIST },
  ];

  function resize() {
    const rect = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(320, Math.floor(rect.width));
    h = Math.max(240, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (img && img.complete) rebuildParticles();
  }

  function sampleImage() {
    // draw image into offscreen to sample
    const maxSide = 160;
    const scale = Math.min(maxSide / img.naturalWidth, maxSide / img.naturalHeight);
    const iw = Math.floor(img.naturalWidth * scale);
    const ih = Math.floor(img.naturalHeight * scale);
    const off = document.createElement("canvas");
    off.width = iw;
    off.height = ih;
    const octx = off.getContext("2d");
    octx.drawImage(img, 0, 0, iw, ih);
    const data = octx.getImageData(0, 0, iw, ih).data;
    return { data, iw, ih };
  }

  function fitImageRect() {
    const pad = 0.08;
    const maxW = w * (1 - pad * 2);
    const maxH = h * (1 - pad * 2);
    const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    return {
      x: (w - dw) / 2,
      y: (h - dh) / 2,
      dw,
      dh,
    };
  }

  function rebuildParticles() {
    const { data, iw, ih } = sampleImage();
    const fit = fitImageRect();
    particles = [];
    const step = 2; // sample stride
    for (let y = 0; y < ih; y += step) {
      for (let x = 0; x < iw; x += step) {
        const i = (y * iw + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3] / 255;
        if (a < 0.15) continue;
        // skip near-white paper
        const lum = (r + g + b) / 3;
        if (lum > 235) continue;
        const darkness = 1 - lum / 255;
        if (darkness < 0.06) continue;

        const bx = fit.x + (x / iw) * fit.dw;
        const by = fit.y + (y / ih) * fit.dh;

        // cosmos home: random on a ring
        const ring = 0.15 + Math.random() * 0.75;
        const theta = Math.random() * Math.PI * 2;
        const cx = w / 2 + Math.cos(theta) * ring * Math.min(w, h) * 0.38;
        const cy = h / 2 + Math.sin(theta) * ring * Math.min(w, h) * 0.32;

        particles.push({
          bx,
          by,
          cx,
          cy,
          x: bx,
          y: by,
          vx: 0,
          vy: 0,
          size: 0.6 + darkness * 1.8,
          alpha: 0.25 + darkness * 0.75,
          mist: darkness < 0.45,
        });
      }
    }
    // cap particle count for perf
    if (particles.length > 4500) {
      const keep = 4500 / particles.length;
      particles = particles.filter(() => Math.random() < keep);
    }
    ready = true;
  }

  function setState(next) {
    state = next;
    stage.dataset.state = next;
    if (hint) {
      if (next === "building") {
        hint.textContent = "Click the building → enter orbit";
      } else if (next === "scatter") {
        hint.textContent = "…";
      } else {
        hint.textContent = "Click again → return to the saucer";
      }
    }
  }

  function toggle() {
    if (reduce || !ready) return;
    if (state === "building") {
      setState("scatter");
      // kick scatter velocities
      for (const p of particles) {
        p.vx = (Math.random() - 0.5) * 14;
        p.vy = (Math.random() - 0.5) * 14;
      }
      animT = 0;
    } else if (state === "cosmos") {
      setState("building");
    }
  }

  function step(dt) {
    animT += dt;
    if (state === "scatter") {
      let settled = 0;
      for (const p of particles) {
        // fly toward cosmos positions with drag
        p.vx += (p.cx - p.x) * 0.04;
        p.vy += (p.cy - p.y) * 0.04;
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;
        if (Math.hypot(p.x - p.cx, p.y - p.cy) < 3 && Math.hypot(p.vx, p.vy) < 0.4) {
          settled++;
        }
      }
      if (settled > particles.length * 0.55 || animT > 900) {
        for (const p of particles) {
          p.x = p.cx;
          p.y = p.cy;
        }
        setState("cosmos");
      }
    } else if (state === "building") {
      for (const p of particles) {
        p.x += (p.bx - p.x) * 0.12;
        p.y += (p.by - p.y) * 0.12;
      }
    } else if (state === "cosmos") {
      const t = performance.now();
      const R = Math.min(w, h) * 0.38;
      // slow drift of field + body attractors for sparkle
      for (const p of particles) {
        const ang = Math.atan2(p.y - h / 2, p.x - w / 2) + 0.0008 * dt;
        const rad = Math.hypot(p.x - w / 2, p.y - h / 2);
        const targetR = rad; // keep radius, rotate slowly
        p.x = w / 2 + Math.cos(ang) * targetR;
        p.y = h / 2 + Math.sin(ang) * targetR * 0.92;
      }
      // update body positions for drawing
      for (const b of bodies) {
        if (b.r === 0) {
          b.x = w / 2;
          b.y = h / 2;
        } else {
          const a = t * b.speed + b.phase;
          b.x = w / 2 + Math.cos(a) * b.r * R * 2.1;
          b.y = h / 2 + Math.sin(a) * b.r * R * 1.85;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // cream wash already on page; light vignette
    if (state === "cosmos") {
      // faint orbit rings
      ctx.save();
      ctx.strokeStyle = "rgba(139,132,153,0.18)";
      ctx.lineWidth = 1;
      const R = Math.min(w, h) * 0.38;
      for (const b of bodies) {
        if (b.r === 0) continue;
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, b.r * R * 2.1, b.r * R * 1.85, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const p of particles) {
      const [cr, cg, cb] = p.mist ? MIST : INK;
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${p.alpha})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    if (state === "cosmos") {
      for (const b of bodies) {
        const [cr, cg, cb] = b.color;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.95)`;
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        // soft glow
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.12)`;
        ctx.arc(b.x, b.y, b.size * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // labels
      ctx.font = "500 11px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.fillStyle = "rgba(92,86,104,0.9)";
      ctx.textAlign = "center";
      for (const b of bodies) {
        ctx.fillText(b.name, b.x, b.y + b.size + 14);
      }
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(32, now - last);
    last = now;
    if (!reduce && ready) {
      step(dt);
      draw();
    }
    raf = requestAnimationFrame(loop);
  }

  function drawStaticFallback() {
    // reduced motion: just draw the image centered
    ctx.clearRect(0, 0, w, h);
    if (!img) return;
    const fit = fitImageRect();
    ctx.drawImage(img, fit.x, fit.y, fit.dw, fit.dh);
  }

  // load
  img = new Image();
  img.decoding = "async";
  img.onload = () => {
    resize();
    if (reduce) {
      drawStaticFallback();
      if (hint) hint.textContent = "MacMillan Space Centre";
    } else {
      rebuildParticles();
      setState("building");
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };
  img.onerror = () => {
    if (hint) hint.textContent = "Could not load landmark art";
  };
  img.src = imgSrc;

  window.addEventListener("resize", () => {
    resize();
    if (reduce) drawStaticFallback();
  });

  canvas.addEventListener("click", toggle);
  canvas.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
  if (hint) {
    hint.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });
  }

  // public for debugging
  window.__vanOrbit = { toggle, setState };
})();
