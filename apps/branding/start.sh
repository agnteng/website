#!/bin/sh
# Resolves .env.schema's secrets from 1Password and starts the server with them, or without them
# if they don't resolve within 30 s, so the decks never wait on 1Password (docs/adr/0027).
set -u
if resolved="$(timeout 30 ./node_modules/.bin/varlock load --format shell --compact 2>/tmp/varlock.err)"; then
  eval "$resolved"
else
  echo "[start] secrets not resolved from 1Password; starting without them:" >&2
  grep -E "⛔|error resolving|Error:" /tmp/varlock.err >&2 || echo "[start] (no summary from varlock)" >&2
fi
rm -f /tmp/varlock.err
exec node ./dist/server/entry.mjs
