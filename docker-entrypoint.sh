#!/bin/sh
set -eu

escape_js_string() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

SUPABASE_URL=${VITE_SUPABASE_URL:-}
SUPABASE_KEY=${VITE_SUPABASE_ANON_KEY:-}

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables must be set." >&2
  exit 1
fi

echo "Injecting Supabase configuration into runtime-env.js"

escaped_url=$(escape_js_string "$SUPABASE_URL")
escaped_key=$(escape_js_string "$SUPABASE_KEY")

cat <<RUNTIME_ENV >/usr/share/nginx/html/runtime-env.js
window.__ENV__ = {
  VITE_SUPABASE_URL: "${escaped_url}",
  VITE_SUPABASE_ANON_KEY: "${escaped_key}"
};
RUNTIME_ENV

exec nginx -g 'daemon off;'
