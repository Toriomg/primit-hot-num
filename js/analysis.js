// Devuelve los contadores de frecuencia para números principales, complementario y reintegro
export function calcFreq(draws) {
  const main = new Array(50).fill(0); // índices 1–49
  const comp = new Array(50).fill(0); // índices 1–49
  const rein = new Array(10).fill(0); // índices 0–9

  for (const d of draws) {
    for (const n of d.numbers)
      if (n >= 1 && n <= 49) main[n]++;
    if (d.complementario >= 1 && d.complementario <= 49) comp[d.complementario]++;
    if (d.reintegro      >= 0 && d.reintegro      <=  9) rein[d.reintegro]++;
  }
  return { main, comp, rein };
}

// Devuelve los elementos del rango [lo, hi] ordenados de mayor a menor frecuencia
export function ranked(arr, lo, hi) {
  return arr
    .slice(lo, hi + 1)
    .map((count, i) => ({ num: i + lo, count }))
    .sort((a, b) => b.count - a.count);
}

// Asigna un color a cada número según su posición en el ranking (rojo = caliente, azul = frío)
export function makeBarColors(mainFreq) {
  const order   = ranked(mainFreq, 1, 49);
  const color   = new Array(50);
  const palette = [
    '#e74c3c', '#e74c3c', '#e74c3c', // top 1–3   rojo
    '#e67e22', '#e67e22', '#e67e22', // top 4–6   naranja
    '#f39c12', '#f39c12', '#f39c12', // top 7–9   ámbar
    '#f4c430',                        // top 10    dorado
  ];

  order.forEach(({ num }, i) => {
    color[num] = i < palette.length ? palette[i]
               : i < 25             ? '#4895ef'  // medio  azul
               : '#253058';                       // frío   azul oscuro
  });
  return color;
}
