import { supabase } from "./supabase.js";
import { saveCache, state } from "./state.js";

export async function fetchExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("*, categories(*)")
    .eq("user_id", state.session.user.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.expenses = data || [];
  saveCache(state.session.user.id);
  return state.expenses;
}

export async function createExpense(payload) {
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...payload, user_id: state.session.user.id })
    .select("*, categories(*)")
    .single();
  if (error) throw error;
  state.expenses = [data, ...state.expenses];
  saveCache(state.session.user.id);
  return data;
}

export async function updateExpense(id, payload) {
  const previous = [...state.expenses];
  state.expenses = state.expenses.map((expense) => expense.id === id ? { ...expense, ...payload } : expense);

  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .eq("user_id", state.session.user.id)
    .select("*, categories(*)")
    .single();
  if (error) {
    state.expenses = previous;
    throw error;
  }
  state.expenses = state.expenses.map((expense) => expense.id === id ? data : expense);
  saveCache(state.session.user.id);
  return data;
}

export async function deleteExpense(id) {
  const previous = [...state.expenses];
  state.expenses = state.expenses.filter((expense) => expense.id !== id);
  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", state.session.user.id);
  if (error) {
    state.expenses = previous;
    throw error;
  }
  saveCache(state.session.user.id);
}

export function subscribeToExpenses(onChange) {
  if (state.realtimeChannel) supabase.removeChannel(state.realtimeChannel);
  state.realtimeChannel = supabase
    .channel("expense-tracker-dashboard")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "expenses", filter: `user_id=eq.${state.session.user.id}` },
      onChange
    )
    .subscribe();
}
