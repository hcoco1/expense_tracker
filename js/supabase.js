const SUPABASE_URL = window.EXPENSE_TRACKER_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.EXPENSE_TRACKER_SUPABASE_ANON_KEY || "";

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
