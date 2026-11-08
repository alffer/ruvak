#!/usr/bin/env bash
# Prueba la migración, la semilla y las políticas RLS en un Postgres local desechable.
# Requiere los binarios de PostgreSQL 15+ (initdb, pg_ctl, psql). No toca tu proyecto de Supabase.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(dirname "$(command -v initdb || ls /usr/lib/postgresql/*/bin/initdb | tail -1)")}"
TMP="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  chown postgres "$TMP"
  RUN_AS=(runuser -u postgres --)
fi
cleanup() { "${RUN_AS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

"${RUN_AS[@]}" "$PGBIN/initdb" -D "$TMP/data" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
"${RUN_AS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP" -l "$TMP/log" start >/dev/null

PSQL=("${RUN_AS[@]}" "$PGBIN/psql" -h "$TMP" -p "$PORT" -U postgres -d postgres -q -v ON_ERROR_STOP=1)
"${PSQL[@]}" -f "$ROOT/scripts/rls-stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql"
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql" # la semilla debe poder repetirse sin duplicar
"${PSQL[@]}" -c "do \$\$ begin assert (select count(*) from public.places) = 9, 'la semilla duplicó lugares'; end \$\$;"
"${PSQL[@]}" -f "$ROOT/scripts/check-rls.sql"
