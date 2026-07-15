const PAGE_SIZE = 5;

// Devuelve { draws, meta } donde meta incluye lo que reporta la API
export async function fetchDraws(base, proxy, key, days) {
  const today  = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = isoDate(cutoff);

  const allDraws = [];
  let page       = 1;
  let totalPages = null; // null = desconocido hasta la primera respuesta

  while (true) {
    const target = `${base}/results/primitiva?page=${page}&limit=${PAGE_SIZE}`;
    const url    = proxy ? `${proxy}${encodeURIComponent(target)}` : target;

    const res = await fetch(url, {
      headers: { 'X-API-Key': key, 'Accept': 'application/json' },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `Error ${res.status} de la API.\nURL: ${target}\n\n${body.slice(0, 600)}`
      );
    }

    const json = await res.json();
    const { draws, meta } = parsePage(json);

    // Guardamos el total de páginas en la primera respuesta
    if (totalPages === null) totalPages = meta.totalPages ?? 1;

    // Añadimos solo los sorteos dentro del rango pedido
    for (const d of draws) {
      if (d.date >= cutoffStr) allDraws.push(d);
    }

    // Condiciones de parada:
    // 1. Ya pasamos la última página disponible
    // 2. El sorteo más antiguo de la página está antes de nuestro corte
    // 3. No hay más páginas según la API
    const oldestOnPage = draws.at(-1)?.date ?? '';
    const noMorePages  = page >= totalPages || !meta.hasNext;
    const pastCutoff   = draws.length > 0 && oldestOnPage < cutoffStr;

    if (noMorePages || pastCutoff) break;

    page++;
    await sleep(200); // respetar burst limit del plan gratuito
  }

  return { draws: allDraws, totalAvailable: (totalPages ?? 1) * PAGE_SIZE };
}

// ── Parseo ────────────────────────────────────────────────────────────────────
function parsePage(raw) {
  const payload = (raw?.success !== undefined && raw.data !== undefined) ? raw.data : raw;

  const arr = Array.isArray(payload) ? payload
            : payload?.results ?? payload?.draws ?? payload?.data ?? null;

  if (!arr) {
    throw new Error(
      'Formato de respuesta no reconocido:\n' + JSON.stringify(raw).slice(0, 800)
    );
  }

  const draws = arr
    .filter(d => (d.status ?? 'COMPLETED') === 'COMPLETED')
    .map(d => {
      const numbers = (d.combination ?? d.numbers ?? d.winning_numbers ?? d.numeros ?? []).map(Number);
      const rd      = d.resultData ?? {};
      return {
        date:           d.drawDate ?? d.date ?? d.draw_date ?? d.fecha ?? '',
        numbers,
        complementario: Number(rd.complementario ?? d.complementario ?? d.bonus ?? 0),
        reintegro:      Number(rd.reintegro      ?? d.reintegro ?? d.refund ?? -1),
      };
    })
    .filter(d => d.numbers.length >= 6);

  const meta = raw?.meta ?? {};
  return {
    draws,
    meta: {
      hasNext:    meta.hasNext    ?? false,
      totalPages: meta.totalPages ?? null,
      total:      meta.total      ?? null,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
