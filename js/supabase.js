function parseEnv(source) {
  return source.split("\n").reduce((values, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return values;

    const separator = trimmed.indexOf("=");
    if (separator === -1) return values;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
    return values;
  }, {});
}

async function loadEnv() {
  try {
    const response = await fetch("./env.json", { cache: "no-store" });
    if (response.ok) return response.json();
  } catch {
    // Fall back to local .env for simple static-server development.
  }

  try {
    const response = await fetch("./.env", { cache: "no-store" });
    if (!response.ok) return {};
    return parseEnv(await response.text());
  } catch {
    return {};
  }
}

const env = await loadEnv();
const SUPABASE_URL = env.EXPENSE_TRACKER_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = env.EXPENSE_TRACKER_SUPABASE_ANON_KEY || "";

export const isConfigured = () =>
  SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 30;

export const supabase = isConfigured()
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export async function requireSession() {
  if (!supabase) {
    window.location.href = "./index.html";
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    window.location.href = "./index.html";
    return null;
  }
  return data.session;
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
