const panels = Array.from(document.querySelectorAll("[data-panel]"));
const progress = document.querySelector("#readerProgress");
let current = 0;
let isProgrammaticScroll = false;

function pad(value) {
  return String(value).padStart(4, "0");
}

function setProgress(index) {
  current = Math.max(0, Math.min(panels.length - 1, index));
  progress.value = `${pad(current + 1)} / ${pad(panels.length)}`;
  progress.textContent = progress.value;
}

function goTo(index) {
  const next = Math.max(0, Math.min(panels.length - 1, index));
  const panel = panels[next];
  if (!panel) return;

  isProgrammaticScroll = true;
  setProgress(next);
  history.replaceState(null, "", `#${panel.id}`);
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    isProgrammaticScroll = false;
  }, 420);
}

function panelFromHash() {
  if (!location.hash) return -1;
  return panels.findIndex((panel) => `#${panel.id}` === location.hash);
}

const observer = new IntersectionObserver(
  (entries) => {
    if (isProgrammaticScroll) return;

    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const index = panels.indexOf(visible.target);
    if (index >= 0) {
      setProgress(index);
      history.replaceState(null, "", `#${visible.target.id}`);
    }
  },
  {
    root: null,
    rootMargin: "-38% 0px -38% 0px",
    threshold: [0.08, 0.2, 0.4, 0.6],
  },
);

for (const panel of panels) {
  observer.observe(panel);
}

window.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) return;

  const key = event.key;
  if (key === "ArrowDown" || key === "ArrowRight" || key === "PageDown" || key === " ") {
    event.preventDefault();
    goTo(current + 1);
  }

  if (key === "ArrowUp" || key === "ArrowLeft" || key === "PageUp" || key === "Backspace") {
    event.preventDefault();
    goTo(current - 1);
  }

  if (key === "Home") {
    event.preventDefault();
    goTo(0);
  }

  if (key === "End") {
    event.preventDefault();
    goTo(panels.length - 1);
  }

  if (key.toLowerCase() === "f" && document.fullscreenEnabled) {
    event.preventDefault();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }
});

const initialPanel = panelFromHash();
setProgress(initialPanel >= 0 ? initialPanel : 0);

if (initialPanel >= 0) {
  isProgrammaticScroll = true;
  window.requestAnimationFrame(() => {
    panels[initialPanel].scrollIntoView({ behavior: "auto", block: "start" });
    window.setTimeout(() => {
      isProgrammaticScroll = false;
    }, 500);
  });
}
