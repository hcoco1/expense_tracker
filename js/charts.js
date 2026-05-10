import { state } from "./state.js";

let categoryChart;
let trendChart;

function chartTextColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();
}

export function filteredExpenses() {
  return state.expenses.filter((expense) => {
    const date = new Date(`${expense.expense_date}T00:00:00`);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const categoryMatch = state.filters.category === "all" || expense.category_id === state.filters.category;
    return categoryMatch && month === state.filters.month && year === state.filters.year;
  });
}

export function calculateSummary(expenses = filteredExpenses()) {
  return expenses.reduce((summary, expense) => {
    const type = expense.categories?.type || state.categories.find((category) => category.id === expense.category_id)?.type || "expense";
    const amount = Number(expense.amount || 0);
    if (type === "income") summary.income += amount;
    else summary.expense += amount;
    summary.balance = summary.income - summary.expense;
    return summary;
  }, { income: 0, expense: 0, balance: 0 });
}

export function renderCharts(expenses = filteredExpenses()) {
  const categoryCanvas = document.getElementById("categoryChart");
  const trendCanvas = document.getElementById("trendChart");
  if (!categoryCanvas || !trendCanvas || !window.Chart) return;

  const expenseOnly = expenses.filter((expense) => {
    const type = expense.categories?.type || state.categories.find((category) => category.id === expense.category_id)?.type;
    return type !== "income";
  });

  const byCategory = new Map();
  expenseOnly.forEach((expense) => {
    const category = expense.categories || state.categories.find((entry) => entry.id === expense.category_id);
    const key = category?.name || "Uncategorized";
    const current = byCategory.get(key) || { value: 0, color: category?.color || "#64748b" };
    current.value += Number(expense.amount || 0);
    byCategory.set(key, current);
  });

  const labels = [...byCategory.keys()];
  const values = [...byCategory.values()].map((entry) => entry.value);
  const colors = [...byCategory.values()].map((entry) => entry.color);

  categoryChart?.destroy();
  categoryChart = new Chart(categoryCanvas, {
    type: "doughnut",
    data: { labels, datasets: [{ data: values.length ? values : [1], backgroundColor: values.length ? colors : ["#334155"], borderWidth: 0 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { position: "bottom", labels: { color: chartTextColor(), boxWidth: 10, usePointStyle: true } },
        tooltip: { enabled: Boolean(values.length) }
      }
    }
  });

  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Number(state.filters.year), Number(state.filters.month) - 1 - (5 - index), 1);
    return {
      label: date.toLocaleDateString(undefined, { month: "short" }),
      month: String(date.getMonth() + 1).padStart(2, "0"),
      year: String(date.getFullYear())
    };
  });

  const trend = months.map((bucket) => state.expenses.reduce((total, expense) => {
    const date = new Date(`${expense.expense_date}T00:00:00`);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const type = expense.categories?.type || state.categories.find((category) => category.id === expense.category_id)?.type;
    return month === bucket.month && year === bucket.year && type !== "income" ? total + Number(expense.amount || 0) : total;
  }, 0));

  trendChart?.destroy();
  trendChart = new Chart(trendCanvas, {
    type: "line",
    data: {
      labels: months.map((bucket) => bucket.label),
      datasets: [{
        data: trend,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.16)",
        fill: true,
        tension: 0.38,
        pointRadius: 4,
        pointBackgroundColor: "#3b82f6"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: chartTextColor() }, grid: { display: false } },
        y: { ticks: { color: chartTextColor() }, grid: { color: "rgba(148, 163, 184, 0.14)" } }
      }
    }
  });
}
