import { requireSession, supabase } from "./supabase.js";
import { fetchCategories, seedDefaultCategories } from "./categories.js";
import { calculateSummary, filteredExpenses, renderCharts } from "./charts.js";
import { createExpense, deleteExpense, fetchExpenses, subscribeToExpenses, updateExpense } from "./expenses.js";
import { currencies, loadCache, saveCache, state } from "./state.js";
import {
  $,
  bindGlobalUi,
  closeAllModals,
  closeModal,
  colorClass,
  currentDateInput,
  escapeHtml,
  formatCurrency,
  formatDate,
  initIcons,
  openModal,
  populateCurrencySelect,
  renderEmpty,
  renderSkeleton,
  setButtonLoading,
  toast
} from "./ui.js";

function categoryFor(expense) {
  return expense.categories || state.categories.find((category) => category.id === expense.category_id);
}

function renderCategorySelects() {
  const filter = $("#filterCategory");
  const formSelect = $("#expenseCategory");
  const categoryOptions = state.categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.name)} (${category.type})</option>`)
    .join("");

  if (filter) {
    filter.innerHTML = `<option value="all">All categories</option>${state.categories.map((category) => (
      `<option value="${category.id}" ${state.filters.category === category.id ? "selected" : ""}>${escapeHtml(category.name)}</option>`
    )).join("")}`;
  }

  if (formSelect) {
    formSelect.innerHTML = categoryOptions || `<option value="">Create a category first</option>`;
  }
}

function renderDateFilters() {
  const month = $("#filterMonth");
  const year = $("#filterYear");
  if (!month || !year) return;

  month.innerHTML = Array.from({ length: 12 }, (_, index) => {
    const value = String(index + 1).padStart(2, "0");
    const label = new Date(2026, index, 1).toLocaleDateString(undefined, { month: "long" });
    return `<option value="${value}" ${value === state.filters.month ? "selected" : ""}>${label}</option>`;
  }).join("");

  const currentYear = new Date().getFullYear();
  year.innerHTML = Array.from({ length: 7 }, (_, index) => String(currentYear - 5 + index))
    .map((value) => `<option value="${value}" ${value === state.filters.year ? "selected" : ""}>${value}</option>`)
    .join("");
}

function renderSummary(expenses) {
  const summary = calculateSummary(expenses);
  $("#monthlyIncome").textContent = formatCurrency(summary.income);
  $("#monthlyExpenses").textContent = formatCurrency(summary.expense);
  $("#monthlySavings").textContent = formatCurrency(summary.balance);
  $("#totalBalance").textContent = formatCurrency(calculateSummary(state.expenses).balance);
  const rate = summary.income ? Math.max(0, Math.round((summary.balance / summary.income) * 100)) : 0;
  $("#savingsRate").textContent = `${rate}% saved this month`;
}

function renderExpenses() {
  const target = $("#expenseList");
  if (!target) return;
  const expenses = filteredExpenses();
  renderSummary(expenses);
  renderCharts(expenses);

  if (!expenses.length) {
    renderEmpty(target, "No transactions here", "Add income or expenses to start seeing patterns.");
    return;
  }

  target.innerHTML = expenses.slice(0, 30).map((expense) => {
    const category = categoryFor(expense);
    const type = category?.type || "expense";
    const sign = type === "income" ? "+" : "-";
    return `
      <article class="transaction" data-id="${expense.id}">
        <div class="avatar ${colorClass(category?.color)}" aria-hidden="true"><i data-lucide="${category?.icon || "circle-dollar-sign"}"></i></div>
        <div class="item-title">
          <strong>${escapeHtml(expense.note || category?.name || "Transaction")}</strong>
          <span>${escapeHtml(category?.name || "Uncategorized")} · ${escapeHtml(expense.payment_method || "Other")} · ${formatDate(expense.expense_date)}</span>
        </div>
        <div>
          <div class="amount ${type}">${sign}${formatCurrency(expense.amount)}</div>
          <div class="row-actions">
            <button class="icon-btn" type="button" data-action="edit-expense" aria-label="Edit transaction"><i data-lucide="pencil"></i></button>
            <button class="icon-btn" type="button" data-action="delete-expense" aria-label="Delete transaction"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      </article>
    `;
  }).join("");
  initIcons();
}

function resetExpenseForm(expense = null) {
  $("#expenseForm").reset();
  $("#expenseId").value = expense?.id || "";
  $("#expenseAmount").value = expense?.amount || "";
  $("#expenseCategory").value = expense?.category_id || state.categories[0]?.id || "";
  $("#paymentMethod").value = expense?.payment_method || "Card";
  $("#expenseDate").value = expense?.expense_date || currentDateInput();
  $("#expenseNote").value = expense?.note || "";
  $("#expenseModalTitle").textContent = expense ? "Edit Transaction" : "Add Transaction";
}

function syncAll() {
  renderCategorySelects();
  renderDateFilters();
  populateCurrencySelect($("#currencySelect"));
  renderExpenses();
}

function bindDashboardEvents() {
  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-action]");
    const action = trigger?.dataset.action;
    const item = event.target.closest("[data-id]");
    const expense = item ? state.expenses.find((entry) => entry.id === item.dataset.id) : null;

    if (action === "open-expense-modal") {
      resetExpenseForm();
      openModal("expenseModal");
    }
    if (action === "edit-expense" && expense) {
      resetExpenseForm(expense);
      openModal("expenseModal");
    }
    if (action === "delete-expense" && expense) {
      state.pendingDeleteId = expense.id;
      openModal("confirmModal");
    }
    if (action === "close-confirm") closeModal("confirmModal");
    if (action === "confirm-delete" && state.pendingDeleteId) {
      try {
        await deleteExpense(state.pendingDeleteId);
        renderExpenses();
        toast("Transaction deleted.", "success");
      } catch (error) {
        toast(error.message || "Unable to delete transaction.", "error");
      } finally {
        state.pendingDeleteId = null;
        closeModal("confirmModal");
      }
    }
    if (action === "refresh") {
      await refreshData();
    }
    if (action === "logout") {
      await supabase.auth.signOut();
      window.location.href = "./index.html";
    }
  });

  $("#filterCategory").addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    renderExpenses();
  });
  $("#filterMonth").addEventListener("change", (event) => {
    state.filters.month = event.target.value;
    renderExpenses();
  });
  $("#filterYear").addEventListener("change", (event) => {
    state.filters.year = event.target.value;
    renderExpenses();
  });
  $("#currencySelect").addEventListener("change", (event) => {
    state.filters.currency = event.target.value;
    localStorage.setItem("expense_tracker_currency", state.filters.currency);
    renderExpenses();
  });

  $("#expenseForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const button = form.querySelector("button[type='submit']");
    const payload = {
      amount: Number($("#expenseAmount").value),
      category_id: $("#expenseCategory").value,
      payment_method: $("#paymentMethod").value,
      expense_date: $("#expenseDate").value,
      note: $("#expenseNote").value.trim()
    };

    setButtonLoading(button, true, "Saving");
    try {
      const id = $("#expenseId").value;
      if (id) {
        await updateExpense(id, payload);
        toast("Transaction updated.", "success");
      } else {
        await createExpense(payload);
        toast("Transaction added.", "success");
      }
      renderExpenses();
      closeAllModals();
    } catch (error) {
      toast(error.message || "Unable to save transaction.", "error");
    } finally {
      setButtonLoading(button, false);
    }
  });
}

async function refreshData() {
  try {
    await Promise.all([fetchCategories(), fetchExpenses()]);
    syncAll();
    toast("Dashboard updated.", "success");
  } catch (error) {
    toast(error.message || "Unable to refresh data.", "error");
  }
}

async function initDashboard() {
  bindGlobalUi();
  state.session = await requireSession();
  if (!state.session) return;

  loadCache(state.session.user.id);
  bindDashboardEvents();
  renderSkeleton($("#expenseList"), 5);
  renderDateFilters();
  populateCurrencySelect($("#currencySelect"));

  try {
    await seedDefaultCategories();
    await Promise.all([fetchCategories(), fetchExpenses()]);
    syncAll();
    subscribeToExpenses(async () => {
      await fetchExpenses();
      renderExpenses();
    });
  } catch (error) {
    syncAll();
    toast(error.message || "Showing cached dashboard data.", "error");
  }

  window.addEventListener("beforeunload", () => saveCache(state.session?.user?.id));
}

initDashboard();
