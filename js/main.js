import { openDB, getLastDate, insertDraws, getAllDraws } from './db.js';
import { calcFreq }                                      from './analysis.js';
import { drawFreqChart, drawCompChart, drawReinChart }   from './charts.js';
import { renderSummary, drawHotList, drawSuggestion,
         renderDBStatus, setLoading, showError, hideError } from './ui.js';
import { loadSettings, saveSettings }                    from './storage.js';

const $ = id => document.getElementById(id);

let db;

document.addEventListener('DOMContentLoaded', async () => {
  const { days } = loadSettings();
  $('days').value = days;

  $('btnAnalyze').addEventListener('click', render);
  $('advToggle').addEventListener('click', () => {
    const hidden = $('advPanel').classList.toggle('hidden');
    $('advArrow').textContent = hidden ? '▶' : '▼';
  });

  db = await openDB();
  await render();
});

async function render() {
  setLoading(true);
  hideError();
  $('results').classList.add('hidden');

  try {
    // Primera vez: cargar seed.json en IndexedDB
    const lastDate = await getLastDate(db);
    if (!lastDate) {
      const seed = await loadSeed();
      if (!seed.length) throw new Error(
        'seed.json no encontrado o vacío.\n' +
        'Ejecuta update.sh (Mac/Linux) o update.bat (Windows) para generar los datos.'
      );
      await insertDraws(db, seed);
    }

    const allDraws = await getAllDraws(db);
    if (!allDraws.length) throw new Error('No hay datos. Ejecuta el script de actualización.');

    // Límite dinámico: máximo = días desde el sorteo más antiguo hasta hoy
    const oldest = allDraws[allDraws.length - 1].date;
    const maxDays = daysBetween(oldest, localIsoDate(new Date()));
    $('days').max = String(maxDays);

    // Días solicitados, clampeados al máximo disponible
    let days = Math.max(1, Math.min(maxDays, parseInt($('days').value) || 60));
    $('days').value = String(days);
    saveSettings({ days });

    const cutoffStr = daysAgoIso(days);
    const draws     = allDraws.filter(d => d.date >= cutoffStr);

    renderDBStatus(allDraws.length, localIsoDate(new Date()), 0);

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

async function loadSeed() {
  try {
    const res = await fetch('./seed.json');
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────
function localIsoDate(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function daysAgoIso(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localIsoDate(d);
}

function daysBetween(isoA, isoB) {
  const a = new Date(isoA + 'T12:00:00');
  const b = new Date(isoB + 'T12:00:00');
  return Math.max(1, Math.round((b - a) / 86400000));
}
