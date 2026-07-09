const root = document.documentElement;
const savedTheme = localStorage.getItem("theme");
if (savedTheme) root.dataset.theme = savedTheme;

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

const themeToggle = document.getElementById("themeToggle");
themeToggle?.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
});

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
navToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      if (entry.target.classList.contains("skill-bars")) animateSkillBars();
    }
  });
}, { threshold: 0.16 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

const navAnchors = [...document.querySelectorAll(".nav-links a")];
const sections = navAnchors
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = `#${entry.target.id}`;
    navAnchors.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === id));
  });
}, { rootMargin: "-40% 0px -54% 0px" });
sections.forEach((section) => navObserver.observe(section));

const tabs = document.querySelectorAll(".showcase-tab");
const panels = document.querySelectorAll(".showcase-panel");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.panel;
    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });
    panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === target));
  });
});

const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".project-card");
const searchInput = document.getElementById("projectSearch");

function applyFilters() {
  const active = document.querySelector(".filter.active")?.dataset.filter ?? "all";
  const query = (searchInput?.value ?? "").trim().toLowerCase();

  cards.forEach((card) => {
    const tags = card.dataset.tags.toLowerCase();
    const text = card.innerText.toLowerCase();
    const tagMatch = active === "all" || tags.includes(active);
    const queryMatch = !query || tags.includes(query) || text.includes(query);
    card.hidden = !(tagMatch && queryMatch);
  });
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyFilters();
  });
});
searchInput?.addEventListener("input", applyFilters);

let skillAnimated = false;
function animateSkillBars() {
  if (skillAnimated) return;
  skillAnimated = true;
  document.querySelectorAll(".skill-row").forEach((row) => {
    const level = Number(row.dataset.level || 0);
    row.style.setProperty("--level", `${Math.max(0, Math.min(level, 100))}%`);
  });
}

const canvas = document.getElementById("systemsCanvas");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && !reducedMotion) {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let points = [];
  let frame = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    points = Array.from({ length: Math.max(42, Math.floor(width / 24)) }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.34,
      vy: (Math.random() - 0.5) * 0.34,
      r: 1.4 + Math.random() * 2.8,
      phase: index * 0.37
    }));
  }

  function drawNode(point) {
    const pulse = Math.sin(frame * 0.018 + point.phase) * 0.6 + 1.2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(85, 214, 190, 0.72)";
    ctx.fill();
  }

  function draw() {
    frame += 1;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(16, 19, 18, 0.18)";
    ctx.fillRect(0, 0, width, height);

    for (const point of points) {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < -20) point.x = width + 20;
      if (point.x > width + 20) point.x = -20;
      if (point.y < -20) point.y = height + 20;
      if (point.y > height + 20) point.y = -20;
    }

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 145) {
          const alpha = (1 - distance / 145) * 0.28;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(241, 198, 91, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    points.forEach(drawNode);
    drawSystemGlyphs();
    requestAnimationFrame(draw);
  }

  function drawSystemGlyphs() {
    if (width < 700) return;
    const cx = width * 0.76;
    const cy = height * 0.38;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(frame * 0.01) * 0.08);
    ctx.strokeStyle = "rgba(102, 184, 255, 0.7)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-48, -48, 96, 96);
    ctx.beginPath();
    ctx.moveTo(-72, 0);
    ctx.lineTo(72, 0);
    ctx.moveTo(0, -72);
    ctx.lineTo(0, 72);
    ctx.stroke();
    ctx.fillStyle = "rgba(251, 122, 98, 0.86)";
    ctx.fillRect(-8, -8, 16, 16);
    ctx.restore();
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}
