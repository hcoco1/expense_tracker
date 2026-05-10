import { isConfigured, getSession, supabase } from "./supabase.js";
import { $, bindGlobalUi, initIcons, setButtonLoading, toast } from "./ui.js";

let mode = "login";

function setMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === mode);
  });
  $("#authSubmit span").textContent = mode === "login" ? "Login" : "Create Account";
  $("#authSubmit i").setAttribute("data-lucide", mode === "login" ? "log-in" : "user-plus");
  $("#password").autocomplete = mode === "login" ? "current-password" : "new-password";
  initIcons();
}

async function handleAuth(event) {
  event.preventDefault();
  if (!isConfigured()) {
    toast("Add your Supabase values to .env.", "error");
    return;
  }

  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const button = $("#authSubmit");
  const email = $("#email").value.trim();
  const password = $("#password").value;
  setButtonLoading(button, true, mode === "login" ? "Signing in" : "Creating");

  try {
    const request = mode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });
    const { error } = await request;
    if (error) throw error;

    toast(mode === "login" ? "Welcome back." : "Account created. Check your inbox if email confirmation is enabled.", "success");
    window.location.href = "./dashboard.html";
  } catch (error) {
    toast(error.message || "Authentication failed.", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function initAuth() {
  bindGlobalUi();
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.authTab));
  });
  $("#authForm").addEventListener("submit", handleAuth);

  const session = await getSession();
  if (session) window.location.href = "./dashboard.html";
}

initAuth();
