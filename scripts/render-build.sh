#!/usr/bin/env sh
set -eu

if [ -z "${EXPENSE_TRACKER_SUPABASE_URL:-}" ]; then
  echo "Missing EXPENSE_TRACKER_SUPABASE_URL" >&2
  exit 1
fi

if [ -z "${EXPENSE_TRACKER_SUPABASE_ANON_KEY:-}" ]; then
  echo "Missing EXPENSE_TRACKER_SUPABASE_ANON_KEY" >&2
  exit 1
fi

# Expose as VITE_ vars so Vite embeds them at build time
export VITE_SUPABASE_URL="${EXPENSE_TRACKER_SUPABASE_URL}"
export VITE_SUPABASE_ANON_KEY="${EXPENSE_TRACKER_SUPABASE_ANON_KEY}"

npm install
npm run build
