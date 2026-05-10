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

cat > .env <<EOF
EXPENSE_TRACKER_SUPABASE_URL=${EXPENSE_TRACKER_SUPABASE_URL}
EXPENSE_TRACKER_SUPABASE_ANON_KEY=${EXPENSE_TRACKER_SUPABASE_ANON_KEY}
EOF

echo "Generated .env from Render environment variables."
