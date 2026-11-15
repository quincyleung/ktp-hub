#!/usr/bin/env bash
# Copies the Supabase and Clerk keys from web/.env.local to Vercel (production).
# Prints only variable names, never values.
# Usage: bash web/scripts/env-to-vercel.sh
set -euo pipefail
cd "$(dirname "$0")/.."

for name in SUPABASE_URL SUPABASE_SECRET_KEY NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY; do
  value="$( { grep -E "^${name}=" .env.local || true; } | tail -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//')"
  if [ -z "$value" ]; then
    echo "skipped $name: it's empty in .env.local"
    continue
  fi
  vercel env rm "$name" production --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$name" production >/dev/null
  echo "added $name to Vercel (production)"
done
