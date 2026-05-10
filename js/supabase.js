const SUPABASE_URL = window.EXPENSE_TRACKER_SUPABASE_URL || "https://pbtvyrsknuelaxsnqwpe.supabase.co";
const SUPABASE_ANON_KEY = window.EXPENSE_TRACKER_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBidHZ5cnNrbnVlbGF4c25xd3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MjQzMTAsImV4cCI6MjA5NDAwMDMxMH0.EXG1DWhY8_tsbn3o07bFxqBnQRKDHlOL5TT7a8-URqU";

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
