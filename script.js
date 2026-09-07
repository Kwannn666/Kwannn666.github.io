const root = document.documentElement;
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const themeToggle = document.getElementById('themeToggle');
const colorPreference = window.matchMedia('(prefers-color-scheme: light)');
let explicitTheme = false;
try { explicitTheme = ['dark', 'light'].includes(localStorage.getItem('theme')); } catch { /* Storage is optional. */ }
function applyTheme(theme) {
  root.dataset.theme = theme;
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  themeToggle?.setAttribute('aria-label', label);
  themeToggle?.setAttribute('title', label);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101312' : '#f5f8f7');
}
applyTheme(root.dataset.theme);
if (themeToggle) {
  themeToggle.hidden = false;
  themeToggle.addEventListener('click', () => {
    explicitTheme = true;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch { /* Keep the session preference. */ }
  });
}
colorPreference.addEventListener('change', event => {
  if (!explicitTheme) applyTheme(event.matches ? 'light' : 'dark');
});

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const nav = document.querySelector('.nav');
const compactNav = window.matchMedia('(max-width: 1120px)');
if (navToggle && navLinks && nav) {
  const setMenu = (open, restoreFocus = false) => {
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (restoreFocus) navToggle.focus();
  };
  navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
  navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    const target = document.querySelector(link.getAttribute('href'));
    setMenu(false);
    if (compactNav.matches && target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }));
  nav.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false, true);
    }
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target)) setMenu(false);
  });
  nav.addEventListener('focusout', event => {
    if (event.relatedTarget && !nav.contains(event.relatedTarget)) setMenu(false);
  });
  compactNav.addEventListener('change', () => {
    const focusWillHide = compactNav.matches && navLinks.contains(document.activeElement);
    setMenu(false, focusWillHide);
  });
  nav.classList.add('nav-ready');
}

// A single tab stop, with arrow keys, Home and End as expected for a tablist.
const tabs = [...document.querySelectorAll('.showcase-tab')];
const panels = [...document.querySelectorAll('.showcase-panel')];
function selectTab(tab, focus = false) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.classList.toggle('active', selected);
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panels.forEach(panel => {
    const selected = panel.dataset.panel === tab.dataset.panel;
    panel.hidden = !selected;
    panel.classList.toggle('active', selected);
  });
  if (focus) tab.focus();
}
if (tabs.length && panels.length) {
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next], true);
      }
    });
  });
  selectTab(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
  document.querySelector('.showcase')?.classList.add('tabs-ready');
}

// Index once: hidden cards must still be searchable, without forced layout reads.
const filters = [...document.querySelectorAll('.filter')];
const searchInput = document.getElementById('projectSearch');
const projectCount = document.getElementById('projectCount');
const emptyState = document.getElementById('projectEmpty');
const projectIndex = [...document.querySelectorAll('.project-card')].map(card => ({
  card,
  tags: (card.dataset.tags || '').toLowerCase().split(/\s+/),
  text: `${card.dataset.tags || ''} ${card.textContent}`.toLowerCase().replace(/\s+/g, ' ')
}));
let activeFilter = 'all';
function applyFilters() {
  const terms = (searchInput?.value || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  let visible = 0;
  projectIndex.forEach(({ card, tags, text }) => {
    const match = (activeFilter === 'all' || tags.includes(activeFilter)) && terms.every(term => text.includes(term));
    card.hidden = !match;
    if (match) visible++;
  });
  filters.forEach(button => {
    const active = button.dataset.filter === activeFilter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (projectCount) projectCount.textContent = `${visible} of ${projectIndex.length} projects`;
  if (emptyState) emptyState.hidden = visible !== 0;
}
filters.forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  applyFilters();
}));
searchInput?.addEventListener('input', applyFilters);
document.getElementById('resetFilters')?.addEventListener('click', () => {
  activeFilter = 'all';
  if (searchInput) searchInput.value = '';
  applyFilters();
  searchInput?.focus();
});
if (projectIndex.length) {
  applyFilters();
  const toolbar = document.querySelector('.toolbar');
  if (toolbar) toolbar.hidden = false;
  if (projectCount) projectCount.hidden = false;
}

// Navigation and decorative motion are optional enhancements.
if ('IntersectionObserver' in window) {
  const anchors = [...document.querySelectorAll('.nav-links a')];
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      anchors.forEach(link => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  anchors.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) navObserver.observe(section);
  });
}

function initCanvas() {
  const canvas = document.getElementById('systemsCanvas');
  if (!canvas || !('IntersectionObserver' in window)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 901px)');
  let width = 0, height = 0, points = [], request = 0, last = 0, inView = false;
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    points = Array.from({ length: Math.min(32, Math.floor(width / 40)) }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25
    }));
  }
  function draw(time) {
    request = requestAnimationFrame(draw);
    if (time - last < 1000 / 30) return;
    const step = Math.min(time - (last || time), 50) / 16.67;
    last = time;
    ctx.clearRect(0, 0, width, height);
    const light = root.dataset.theme === 'light';
    ctx.fillStyle = light ? '#126b48' : '#70e0ba';
    points.forEach(point => {
      point.x = (point.x + point.vx * step + width) % width;
      point.y = (point.y + point.vy * step + height) % height;
      ctx.beginPath(); ctx.arc(point.x, point.y, 1.8, 0, Math.PI * 2); ctx.fill();
    });
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i], b = points[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance >= 150) continue;
        ctx.strokeStyle = light ? `rgba(18,107,72,${(1 - distance / 150) * .3})` : `rgba(112,224,186,${(1 - distance / 150) * .3})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  function sync() {
    if (request) cancelAnimationFrame(request);
    request = 0; last = 0;
    if (inView && !document.hidden && !motion.matches && desktop.matches && width && height) {
      request = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
  }
  const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); });
  resize();
  observer.observe(canvas);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  desktop.addEventListener('change', sync);
  window.addEventListener('resize', () => { resize(); sync(); }, { passive: true });
}
initCanvas();
