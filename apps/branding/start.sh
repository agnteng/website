#!/bin/sh
# The container's start (Dockerfile): resolve .env.schema's secrets from the project's
# 1Password vault with the service's OP_TOKEN, then run the server with them in its
# environment. If they can't be resolved (no token, a bad one, 1Password unreachable),
# start anyway: the decks and pages don't need them, and the sponsor form says it can't
# send until a start resolves them (`fitness:live` fails meanwhile). Only varlock's
# summary of what failed reaches the log; it names variables, never values.
set -u
if resolved="$(./node_modules/.bin/varlock load --format shell --compact 2>/tmp/varlock.err)"; then
  eval "$resolved"
else
  echo "[start] secrets not resolved from 1Password; starting without them:" >&2
  grep -E "error resolving|Error:" /tmp/varlock.err >&2 || echo "[start] (varlock exited without a summary)" >&2
fi
unset resolved
rm -f /tmp/varlock.err
exec node ./dist/server/entry.mjs
