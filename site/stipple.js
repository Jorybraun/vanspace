/**
 * Soft Kindolphin-style stipple field behind the centered logo.
 * Respects prefers-reduced-motion.
 */
(function () {
  const canvas = document.getElementById("stipple");
  if (!canvas) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let w = 0;
  let h = 0;
  let dots = [];
  let raf = 0;

  function resize() {
    const parent = canvas.parentElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = parent.clientWidth;
    h = parent.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    if (reduce) draw(0);
  }

  function seed() {
    const count = Math.floor((w * h) / 900);
    dots = [];
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.35 + 0.05,
        phase: Math.random() * Math.PI * 2,
        speed: 0.0004 + Math.random() * 0.0006,
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    // soft vignette toward edges so center (logo) stays clean
    for (const d of dots) {
      const cx = w / 2;
      const cy = h / 2;
      const dist = Math.hypot(d.x - cx, d.y - cy);
      const maxD = Math.hypot(cx, cy);
      // fewer / fainter dots near center
      const centerFade = Math.min(1, dist / (maxD * 0.35));
      const twinkle = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * d.speed + d.phase);
      const alpha = d.a * centerFade * twinkle;
      if (alpha < 0.02) continue;
      ctx.beginPath();
      ctx.fillStyle = `rgba(139, 132, 153, ${alpha})`;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(t) {
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    resize();
    if (!reduce) raf = requestAnimationFrame(loop);
  });

  resize();
  if (!reduce) raf = requestAnimationFrame(loop);
})();
