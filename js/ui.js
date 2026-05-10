import { currencies, state } from "./state.js";

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

export function initIcons() {
  if (window.lucide) window.lucide.createIcons();
}

export function toast(message, type = "info") {
  const colors = {
    info: "linear-gradient(135deg, #3b82f6, #2563eb)",
    success: "linear-gradient(135deg, #22c55e, #16a34a)",
    error: "linear-gradient(135deg, #ef4444, #dc2626)"
  };

  if (window.Toastify) {
    window.Toastify({
      text: message,
      duration: 2800,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: { background: colors[type] || colors.info }
    }).showToast();
  }
}

export function setButtonLoading(button, loading, label = "Working") {
  if (!button) return;
  button.disabled = loading;
  if (loading) {
    button.dataset.originalHtml = button.innerHTML;
    button.innerHTML = `<i data-lucide="loader-2"></i><span>${label}</span>`;
  } else if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
  }
  initIcons();
}

export function openModal(id) {
  const modal = typeof id === "string" ? $(`#${id}`) : id;
  modal?.classList.add("open");
  document.body.style.overflow = "hidden";
}

export function closeModal(id) {
  const modal = typeof id === "string" ? $(`#${id}`) : id;
  modal?.classList.remove("open");
  if (!$(".modal-backdrop.open")) document.body.style.overflow = "";
}

export function closeAllModals() {
  $$(".modal-backdrop").forEach((modal) => modal.classList.remove("open"));
  document.body.style.overflow = "";
}

export function applyTheme() {
  const theme = localStorage.getItem("expense_tracker_theme") || "dark";
  document.documentElement.dataset.theme = theme;
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  localStorage.setItem("expense_tracker_theme", next);
  applyTheme();
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

export function colorClass(color = "#64748b") {
  return `tone-${String(color).replace("#", "").toLowerCase()}`;
}

export function formatCurrency(value, currency = state.filters.currency) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2
  }).format(Number(value || 0));
}

export function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

export function currentDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export function renderSkeleton(target, count = 3) {
  if (!target) return;
  target.innerHTML = Array.from({ length: count }, () => `<div class="skeleton"></div>`).join("");
}

export function renderEmpty(target, title, subtitle = "") {
  if (!target) return;
  target.innerHTML = `
    <div class="empty">
      <div>
        <strong>${escapeHtml(title)}</strong>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
      </div>
    </div>
  `;
}

export function populateCurrencySelect(select) {
  if (!select) return;
  select.innerHTML = currencies
    .map((currency) => `<option value="${currency}" ${currency === state.filters.currency ? "selected" : ""}>${currency}</option>`)
    .join("");
}

export function bindGlobalUi() {
  applyTheme();
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "toggle-theme") toggleTheme();
    if (action === "close-modal") closeAllModals();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllModals();
  });
  initIcons();
}
