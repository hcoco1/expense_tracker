import { state } from "./state.js";

let categoryChart;
let trendChart;

function chartTextColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--muted").trim();
}

function toLocalDate(value) {
  return new Date(`${value}T00:00:00`);
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function periodLabel() {
  const labels = {
    week: "This Week",
    month: "This Month",
    year: "This Year",
    all: "All Time",
    custom: "Custom Period"
  };
  return labels[state.filters.period] || "This Month";
}

export function getPeriodRange() {
  const now = new Date();
  if (state.filters.period === "week") {
    const start = startOfWeek(now);
    const end = endOfDay(new Date(start));
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  if (state.filters.period === "year") {
    const year = Number(state.filters.year);
    return { start: new Date(year, 0, 1), end: endOfDay(new Date(year, 11, 31)) };
  }

  if (state.filters.period === "all") {
    return { start: null, end: null };
  }

  if (state.filters.period === "custom") {
    const start = toLocalDate(state.filters.customStart);
    const end = endOfDay(toLocalDate(state.filters.customEnd));
    return start <= end
      ? { start, end }
      : { start: toLocalDate(state.filters.customEnd), end: endOfDay(toLocalDate(state.filters.customStart)) };
  }

  const year = Number(state.filters.year);
  const month = Number(state.filters.month) - 1;
  return { start: new Date(year, month, 1), end: endOfDay(new Date(year, month + 1, 0)) };
}

export function filteredExpenses() {
  const { start, end } = getPeriodRange();
  return state.expenses.filter((expense) => {
    const date = toLocalDate(expense.expense_date);
    const categoryMatch = state.filters.category === "all" || expense.category_id === state.filters.category;
    const periodMatch = (!start || date >= start) && (!end || date <= end);
    return categoryMatch && periodMatch;
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

  const months = buildTrendBuckets();

  const trend = months.map((bucket) => state.expenses.reduce((total, expense) => {
    const date = toLocalDate(expense.expense_date);
    const type = expense.categories?.type || state.categories.find((category) => category.id === expense.category_id)?.type;
    return date >= bucket.start && date <= bucket.end && type !== "income" ? total + Number(expense.amount || 0) : total;
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

function buildTrendBuckets() {
  if (state.filters.period === "week") {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        start: date,
        end: endOfDay(date)
      };
    });
  }

  if (state.filters.period === "year") {
    const year = Number(state.filters.year);
    return Array.from({ length: 12 }, (_, index) => {
      const start = new Date(year, index, 1);
      return {
        label: start.toLocaleDateString(undefined, { month: "short" }),
        start,
        end: endOfDay(new Date(year, index + 1, 0))
      };
    });
  }

  if (state.filters.period === "custom") {
    const { start, end } = getPeriodRange();
    const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
    if (days <= 31) {
      return Array.from({ length: days }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        return {
          label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          start: date,
          end: endOfDay(date)
        };
      });
    }
  }

  if (state.filters.period === "all") {
    const expenseDates = state.expenses.map((expense) => toLocalDate(expense.expense_date));
    const lastDate = expenseDates.length ? new Date(Math.max(...expenseDates)) : new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(lastDate.getFullYear(), lastDate.getMonth() - (5 - index), 1);
      return {
        label: date.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
        start: date,
        end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
      };
    });
  }

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Number(state.filters.year), Number(state.filters.month) - 1 - (5 - index), 1);
    return {
      label: date.toLocaleDateString(undefined, { month: "short" }),
      start: date,
      end: endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0))
    };
  });
}
