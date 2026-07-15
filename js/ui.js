import { ranked } from './analysis.js';

const $ = id => document.getElementById(id);

// ── Estado de la base de datos local ─────────────────────────────────────────
export function renderDBStatus(total, today, newCount) {
  const el = $('dbStatus');
  if (!el) return;
  const [y, m, d] = today.split('-');
  const dateStr   = `${d}/${m}/${y}`;
  const newInfo   = newCount > 0
    ? ` · <strong>+${newCount} sorteo${newCount > 1 ? 's' : ''} nuevos</strong>`
    : ' · Al día';
  el.innerHTML = `BD local: <strong>${total}</strong> sorteo${total !== 1 ? 's' : ''} guardados · Actualizado: ${dateStr}${newInfo}`;
  el.classList.remove('hidden');
}

// ── Resumen superior ──────────────────────────────────────────────────────────
export function renderSummary(draws, main) {
  const dates   = draws.map(d => d.date).filter(Boolean).sort();
  const topMain = ranked(main, 1, 49)[0];

  $('statDraws').textContent = draws.length;
  $('statFrom').textContent  = dates[0]     ? formatDate(dates[0])     : '—';
  $('statTo').textContent    = dates.at(-1) ? formatDate(dates.at(-1)) : '—';
  $('statHot').textContent   = topMain ? `${topMain.num} (${topMain.count}x)` : '—';
}

// ── Lista top 10 ──────────────────────────────────────────────────────────────
export function drawHotList(main) {
  const top10    = ranked(main, 1, 49).slice(0, 10);
  const maxCount = top10[0]?.count || 1;
  const colors   = [
    '#e74c3c', '#e74c3c', '#e74c3c',
    '#e67e22', '#e67e22', '#e67e22',
    '#f39c12', '#f39c12',
    '#f4c430', '#f4c430',
  ];

  $('hotList').innerHTML = top10.map(({ num, count }, i) => `
    <div class="hot-item">
      <span class="hot-rank">#${i + 1}</span>
      <span class="hot-num" style="color:${colors[i]}">${num}</span>
      <div class="hot-bar-wrap">
        <div class="hot-bar-fill"
             style="width:${(count / maxCount * 100).toFixed(1)}%;background:${colors[i]}"></div>
      </div>
      <span class="hot-count">${count}x</span>
    </div>
  `).join('');
}

// ── Combinación sugerida ──────────────────────────────────────────────────────
export function drawSuggestion(main, rein) {
  const top6 = ranked(main, 1, 49).slice(0, 6).map(x => x.num).sort((a, b) => a - b);
  const topR = rein.reduce((best, v, i) => v > rein[best] ? i : best, 0);

  $('suggRow').innerHTML =
    top6.map(n => `
      <div class="sugg-item">
        <div class="sugg-ball">${n}</div>
      </div>
    `).join('') +
    `<span class="sugg-sep">+</span>
     <div class="sugg-item">
       <div class="rein-ball">${topR}</div>
       <div class="sugg-label">Reintegro</div>
     </div>`;
}

// ── Estados de carga y error ──────────────────────────────────────────────────
export function setLoading(on) {
  $('loading').classList.toggle('hidden', !on);
  $('btnAnalyze').disabled    = on;
  $('btnAnalyze').textContent = on ? 'Cargando…' : 'Aplicar';
}

export function showError(msg) {
  const el = $('error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

export function hideError() {
  $('error').classList.add('hidden');
}

// ── Utilidades ────────────────────────────────────────────────────────────────
function formatDate(str) {
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}
