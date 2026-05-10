import { requireSession, supabase } from "./supabase.js";
import { categoryColors, categoryIcons, defaultCategories, loadCache, saveCache, state } from "./state.js";
import {
  $,
  bindGlobalUi,
  closeAllModals,
  closeModal,
  colorClass,
  escapeHtml,
  initIcons,
  openModal,
  renderEmpty,
  renderSkeleton,
  setButtonLoading,
  toast
} from "./ui.js";

export async function seedDefaultCategories() {
  const userId = state.session.user.id;
  const { data, error } = await supabase.from("categories").select("id").eq("user_id", userId).limit(1);
  if (error) throw error;
  if (data.length) return;

  const rows = defaultCategories.map((category) => ({ ...category, user_id: userId }));
  const { error: insertError } = await supabase.from("categories").insert(rows);
  if (insertError) throw insertError;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", state.session.user.id)
    .order("type")
    .order("name");
  if (error) throw error;
  state.categories = data || [];
  saveCache(state.session.user.id);
  return state.categories;
}

export async function createCategory(payload) {
  const { data, error } = await supabase
    .from("categories")
    .insert({ ...payload, user_id: state.session.user.id })
    .select()
    .single();
  if (error) throw error;
  state.categories.push(data);
  saveCache(state.session.user.id);
  return data;
}

export async function updateCategory(id, payload) {
  const previous = [...state.categories];
  state.categories = state.categories.map((category) => category.id === id ? { ...category, ...payload } : category);
  renderCategories();

  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .eq("user_id", state.session.user.id)
    .select()
    .single();
  if (error) {
    state.categories = previous;
    renderCategories();
    throw error;
  }
  state.categories = state.categories.map((category) => category.id === id ? data : category);
  saveCache(state.session.user.id);
  return data;
}

export async function deleteCategory(id) {
  const previous = [...state.categories];
  state.categories = state.categories.filter((category) => category.id !== id);
  renderCategories();

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", state.session.user.id);
  if (error) {
    state.categories = previous;
    renderCategories();
    throw error;
  }
  saveCache(state.session.user.id);
}

function renderPickers() {
  const colorPicker = $("#colorPicker");
  const iconPicker = $("#iconPicker");
  if (!colorPicker || !iconPicker) return;

  colorPicker.innerHTML = categoryColors
    .map((color) => `<button class="swatch ${colorClass(color)}" type="button" data-color="${color}" aria-label="Choose ${color}"></button>`)
    .join("");
  iconPicker.innerHTML = categoryIcons
    .map((icon) => `<button class="icon-choice" type="button" data-icon="${icon}" aria-label="Choose ${icon}"><i data-lucide="${icon}"></i></button>`)
    .join("");
  syncPickerState();
  initIcons();
}

function syncPickerState() {
  const color = $("#categoryColor")?.value;
  const icon = $("#categoryIcon")?.value;
  document.querySelectorAll("[data-color]").forEach((button) => button.classList.toggle("active", button.dataset.color === color));
  document.querySelectorAll("[data-icon]").forEach((button) => button.classList.toggle("active", button.dataset.icon === icon));
}

function resetCategoryForm(category = null) {
  $("#categoryForm").reset();
  $("#categoryId").value = category?.id || "";
  $("#categoryName").value = category?.name || "";
  $("#categoryType").value = category?.type || "expense";
  $("#categoryColor").value = category?.color || "#3b82f6";
  $("#categoryIcon").value = category?.icon || "circle-dollar-sign";
  $("#categoryModalTitle").textContent = category ? "Edit Category" : "Add Category";
  syncPickerState();
}

export function renderCategories() {
  const target = $("#categoryList");
  if (!target) return;
  if (!state.categories.length) {
    renderEmpty(target, "No categories yet", "Create your first label to organize transactions.");
    return;
  }

  target.innerHTML = state.categories.map((category) => `
    <article class="category-item" data-id="${category.id}">
      <div class="avatar ${colorClass(category.color)}" aria-hidden="true"><i data-lucide="${category.icon}"></i></div>
      <div class="item-title">
        <strong>${escapeHtml(category.name)}</strong>
        <span>${category.type === "income" ? "Income" : "Expense"}</span>
      </div>
      <div>
        <div class="row-actions">
          <button class="icon-btn" type="button" data-action="edit-category" aria-label="Edit ${escapeHtml(category.name)}"><i data-lucide="pencil"></i></button>
          <button class="icon-btn" type="button" data-action="delete-category" aria-label="Delete ${escapeHtml(category.name)}"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    </article>
  `).join("");
  initIcons();
}

function bindCategoryEvents() {
  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest("[data-action]");
    const action = trigger?.dataset.action;
    const item = event.target.closest("[data-id]");
    const category = item ? state.categories.find((entry) => entry.id === item.dataset.id) : null;

    if (action === "open-category-modal") {
      resetCategoryForm();
      openModal("categoryModal");
    }
    if (action === "edit-category" && category) {
      resetCategoryForm(category);
      openModal("categoryModal");
    }
    if (action === "delete-category" && category) {
      state.pendingDeleteId = category.id;
      openModal("confirmModal");
    }
    if (action === "close-confirm") closeModal("confirmModal");
    if (action === "confirm-delete" && state.pendingDeleteId) {
      try {
        await deleteCategory(state.pendingDeleteId);
        toast("Category deleted.", "success");
      } catch (error) {
        toast(error.message || "Unable to delete category.", "error");
      } finally {
        state.pendingDeleteId = null;
        closeModal("confirmModal");
      }
    }
    if (action === "logout") {
      await supabase.auth.signOut();
      window.location.href = "./index.html";
    }
  });

  $("#colorPicker")?.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-color]");
    if (!swatch) return;
    $("#categoryColor").value = swatch.dataset.color;
    syncPickerState();
  });

  $("#iconPicker")?.addEventListener("click", (event) => {
    const icon = event.target.closest("[data-icon]");
    if (!icon) return;
    $("#categoryIcon").value = icon.dataset.icon;
    syncPickerState();
  });

  $("#categoryForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = form.querySelector("button[type='submit']");
    const payload = {
      name: $("#categoryName").value.trim(),
      color: $("#categoryColor").value,
      icon: $("#categoryIcon").value,
      type: $("#categoryType").value
    };

    setButtonLoading(button, true, "Saving");
    try {
      const id = $("#categoryId").value;
      if (id) {
        await updateCategory(id, payload);
        toast("Category updated.", "success");
      } else {
        await createCategory(payload);
        renderCategories();
        toast("Category created.", "success");
      }
      closeAllModals();
    } catch (error) {
      toast(error.message || "Unable to save category.", "error");
    } finally {
      setButtonLoading(button, false);
    }
  });
}

export async function initCategoriesPage() {
  bindGlobalUi();
  state.session = await requireSession();
  if (!state.session) return;

  loadCache(state.session.user.id);
  renderPickers();
  bindCategoryEvents();
  renderSkeleton($("#categoryList"), 5);

  try {
    await seedDefaultCategories();
    await fetchCategories();
    renderCategories();
  } catch (error) {
    renderCategories();
    toast(error.message || "Showing cached categories.", "error");
  }
}

if (document.body && $("#categoryList")) initCategoriesPage();
