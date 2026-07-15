// Plan gratuito: máx. 5 resultados/página, 50 peticiones/día
const PAGE_SIZE = 5;

export async function fetchDraws(base, proxy, key, days) {
  const today   = new Date();
  const cutoff  = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = isoDate(cutoff);  // fecha mínima que nos interesa

  const allDraws = [];
  let page      = 1;
  let keepGoing = true;

  while (keepGoing) {
    // Endpoint básico: lista paginada de primitiva, ordenada por fecha desc
    const target = `${base}/results/primitiva?page=${page}&limit=${PAGE_SIZE}&sort=drawDate&order=desc`;
    const url    = proxy ? `${proxy}${encodeURIComponent(target)}` : target;

    const res = await fetch(url, {
      headers: { 'X-API-Key': key, 'Accept': 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `Error ${res.status} de la API.\nURL solicitada: ${target}\n\n${body.slice(0, 600)}`
      );
    }

    const json = await res.json();
    const { draws, hasNext } = parsePage(json);

    if (draws.length === 0) break;

    // Solo guardamos los sorteos dentro del rango que nos interesa
    for (const d of draws) {
      if (d.date >= cutoffStr) allDraws.push(d);
    }

    // Paramos si: no hay más páginas, o el sorteo más antiguo de esta página
    // ya es anterior a nuestro corte (todo lo que venga será más viejo aún)
    const oldestDate = draws.at(-1)?.date ?? '';
    keepGoing = hasNext && oldestDate >= cutoffStr;

    page++;
    if (keepGoing) await sleep(200); // respetar burst limit del plan gratuito
  }

  return allDraws;
}

// ── Parseo de una página ──────────────────────────────────────────────────────
function parsePage(raw) {
  // La API envuelve en { success, data, meta }
  const payload = (raw?.success !== undefined && raw.data !== undefined) ? raw.data : raw;

  const arr = Array.isArray(payload) ? payload
            : payload?.results ?? payload?.draws ?? payload?.data ?? null;

  if (!arr) {
    throw new Error(
      'Formato de respuesta no reconocido:\n' + JSON.stringify(raw).slice(0, 800)
    );
  }

  const draws = arr.map(d => {
    const numbers = (d.combination ?? d.numbers ?? d.winning_numbers ?? d.numeros ?? []).map(Number);
    const rd      = d.resultData ?? {};
    return {
      date:           d.drawDate ?? d.date ?? d.draw_date ?? d.fecha ?? '',
      numbers,
      complementario: Number(rd.complementario ?? d.complementario ?? d.bonus ?? 0),
      reintegro:      Number(rd.reintegro      ?? d.reintegro ?? d.refund ?? -1),
    };
  }).filter(d => d.numbers.length === 6);

  return { draws, hasNext: raw?.meta?.hasNext ?? false };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
