#!/usr/bin/env bash
# =============================================================
#  Actualiza seed.json con los últimos N días de La Primitiva
#  Requisitos: curl, python3
#  Uso: ./update.sh  (o doble clic en el gestor de ficheros)
# =============================================================
set -euo pipefail

DIAS=90        # ← Cambia este número para ajustar el rango

# ── Rutas ────────────────────────────────────────────────────
DIR="$(cd "$(dirname "$0")" && pwd)"
SEED="$DIR/seed.json"
TMP_RAW="$(mktemp /tmp/prim_raw_XXXXXX.json)"
TMP_PY="$(mktemp /tmp/prim_parse_XXXXXX.py)"
trap 'rm -f "$TMP_RAW" "$TMP_PY"' EXIT

# ── Dependencias ─────────────────────────────────────────────
command -v curl    >/dev/null || { echo "ERROR: curl no encontrado.";    exit 1; }
command -v python3 >/dev/null || { echo "ERROR: python3 no encontrado."; exit 1; }

# ── Fechas (compatible Linux y macOS) ────────────────────────
TODAY=$(date +%Y%m%d)
CUTOFF=$(date -d "$DIAS days ago" +%Y%m%d 2>/dev/null \
      || date -v-${DIAS}d           +%Y%m%d)

echo "Descargando sorteos del $CUTOFF al $TODAY..."

# ── Descarga ─────────────────────────────────────────────────
curl -sf \
  "https://www.loteriasyapuestas.es/servicios/buscadorSorteos?game_id=LAPR&celebrados=true&fechaInicioInclusiva=${CUTOFF}&fechaFinInclusiva=${TODAY}&num_sorteos=200" \
  --compressed \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" \
  -H "Accept-Language: es-ES,es;q=0.9" \
  -H "Accept-Encoding: gzip, deflate, br" \
  -H "Sec-Fetch-Dest: document" \
  -H "Sec-Fetch-Mode: navigate" \
  -H "Sec-Fetch-Site: none" \
  -H "Sec-Fetch-User: ?1" \
  -H "Upgrade-Insecure-Requests: 1" \
  -o "$TMP_RAW" \
  || { echo "ERROR: falló la descarga. Comprueba la conexión."; exit 1; }

# ── Parser Python ────────────────────────────────────────────
cat > "$TMP_PY" << 'PYEOF'
import json, re, sys

seed_path = sys.argv[1]
raw_path  = sys.argv[2]

try:
    with open(seed_path, encoding='utf-8') as f:
        existing = json.load(f)
except Exception:
    existing = []

existing_dates = {d['date'] for d in existing}

with open(raw_path, encoding='utf-8') as f:
    raw = json.load(f)

if not isinstance(raw, list):
    print('ERROR: respuesta inesperada del servidor:', str(raw)[:200])
    sys.exit(1)

new_draws = []
for d in raw:
    fs        = str(d.get('fecha_sorteo', ''))[:10]
    comb      = str(d.get('combinacion', ''))
    nums_part = re.split(r'\s*C\(', comb)[0]
    numbers   = [int(x.strip()) for x in nums_part.split(' - ') if x.strip().isdigit()]
    comp_m    = re.search(r'C\((\d+)\)', comb)
    rein_m    = re.search(r'R\((\d+)\)', comb)
    if len(numbers) == 6 and fs and fs not in existing_dates:
        new_draws.append({
            'date':           fs,
            'numbers':        numbers,
            'complementario': int(comp_m.group(1)) if comp_m else 0,
            'reintegro':      int(rein_m.group(1)) if rein_m else -1,
        })

merged = sorted(existing + new_draws, key=lambda x: x['date'], reverse=True)

with open(seed_path, 'w', encoding='utf-8') as f:
    json.dump(merged, f, separators=(',', ':'))

added = len(new_draws)
total = len(merged)
print('Sorteos nuevos: ' + str(added) + '. Total en seed.json: ' + str(total) + '.')
if added == 0:
    print('El seed ya estaba al dia, no habia sorteos nuevos.')
PYEOF

python3 "$TMP_PY" "$SEED" "$TMP_RAW"
