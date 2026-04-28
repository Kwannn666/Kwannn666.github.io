const root = document.documentElement;
const savedTheme = localStorage.getItem("theme");
if (savedTheme) root.dataset.theme = savedTheme;

document.getElementById("year").textContent = new Date().getFullYear();

const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
});

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});
navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".project-card");
const searchInput = document.getElementById("projectSearch");

function applyFilters() {
  const active = document.querySelector(".filter.active").dataset.filter;
  const q = searchInput.value.trim().toLowerCase();

  cards.forEach(card => {
    const tags = card.dataset.tags.toLowerCase();
    const text = card.innerText.toLowerCase();
    const tagMatch = active === "all" || tags.includes(active);
    const searchMatch = !q || text.includes(q) || tags.includes(q);
    card.style.display = tagMatch && searchMatch ? "" : "none";
  });
}

filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    applyFilters();
  });
});
searchInput.addEventListener("input", applyFilters);
