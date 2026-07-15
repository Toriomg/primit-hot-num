export async function fetchDraws(base, proxy, key, days) {
  const today = new Date();
  const from  = new Date(today);
  from.setDate(from.getDate() - days);

  const target = `${base}/results/primitiva` +
    `?from=${isoDate(from)}&to=${isoDate(today)}&limit=200`;

  const url = proxy ? `${proxy}${encodeURIComponent(target)}` : target;

  const res = await fetch(url, {
    headers: { 'X-API-Key': key, 'Accept': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Error ${res.status} de la API:\n${body.slice(0, 500)}`);
  }

  const json = await res.json();
  return parseDraws(json);
}

function parseDraws(raw) {
  // loteriasapi.com envuelve la respuesta en { success, data }
  const unwrapped = (raw?.success !== undefined && raw.data) ? raw.data : raw;

  const arr = Array.isArray(unwrapped) ? unwrapped
            : unwrapped?.results ?? unwrapped?.draws ?? unwrapped?.data ?? null;

  if (!arr) {
    throw new Error(
      'Formato de respuesta no reconocido. Respuesta recibida:\n' +
      JSON.stringify(raw).slice(0, 800),
    );
  }

  return arr.map(d => {
    const numbers = (d.combination ?? d.numbers ?? d.winning_numbers ?? d.numeros ?? []).map(Number);
    const rd      = d.resultData ?? {};
    return {
      date:           d.drawDate ?? d.date ?? d.draw_date ?? d.fecha ?? '',
      numbers,
      complementario: Number(rd.complementario ?? d.complementario ?? d.bonus ?? 0),
      reintegro:      Number(rd.reintegro      ?? d.reintegro ?? d.refund ?? -1),
    };
  }).filter(d => d.numbers.length === 6);
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}
