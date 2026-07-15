import { fetchDraws }                                    from './api.js';
import { calcFreq }                                       from './analysis.js';
import { drawFreqChart, drawCompChart, drawReinChart }    from './charts.js';
import { renderSummary, drawHotList, drawSuggestion,
         setLoading, showError, hideError }               from './ui.js';
import { loadSettings, saveSettings }                     from './storage.js';

const $ = id => document.getElementById(id);

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const s = loadSettings();
  $('apiKey').value    = s.apiKey;
  $('apiBase').value   = s.apiBase;
  $('corsProxy').value = s.proxy;
  $('days').value      = s.days;

  $('btnAnalyze').addEventListener('click', analyze);
  $('advToggle').addEventListener('click', toggleAdvanced);
});

// ── Panel avanzado ────────────────────────────────────────────────────────────
function toggleAdvanced() {
  const hidden = $('advPanel').classList.toggle('hidden');
  $('advArrow').textContent = hidden ? '▶' : '▼';
}

// ── Flujo principal ───────────────────────────────────────────────────────────
async function analyze() {
  const key   = $('apiKey').value.trim();
  const base  = $('apiBase').value.trim().replace(/\/$/, '');
  const proxy = $('corsProxy').value.trim();
  const days  = Math.max(7, Math.min(365, parseInt($('days').value) || 60));

  if (!key) {
    showError('Introduce tu API key de loteriasapi.com.');
    return;
  }

  saveSettings({ apiKey: key, apiBase: base, proxy, days });

  setLoading(true);
  hideError();
  $('results').classList.add('hidden');

  try {
    const draws = await fetchDraws(base, proxy, key, days);
    if (!draws.length) throw new Error('No se encontraron sorteos en el período indicado.');

    const { main, comp, rein } = calcFreq(draws);

    renderSummary(draws, main);
    drawFreqChart(main);
    drawCompChart(comp);
    drawReinChart(rein);
    drawHotList(main);
    drawSuggestion(main, rein);

    $('results').classList.remove('hidden');
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}
