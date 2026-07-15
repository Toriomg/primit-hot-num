import { makeBarColors } from './analysis.js';

// Chart.js se carga desde CDN como global; no se importa como módulo
const instances = {};

function destroy(key) {
  if (instances[key]) { instances[key].destroy(); delete instances[key]; }
}

export function drawFreqChart(main) {
  destroy('freq');
  const colors = makeBarColors(main);

  instances.freq = new Chart(document.getElementById('chartFreq'), {
    type: 'bar',
    data: {
      labels: Array.from({ length: 49 }, (_, i) => String(i + 1)),
      datasets: [{
        data:            main.slice(1, 50),
        backgroundColor: Array.from({ length: 49 }, (_, i) => colors[i + 1]),
        borderWidth:     0,
        borderRadius:    3,
      }],
    },
    options: {
      responsive:           true,
      maintainAspectRatio:  false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: ([item]) => `Número ${item.label}`,
            label:  item   => `Apariciones: ${item.raw}`,
          },
        },
      },
      scales: {
        x: { ticks: { color: '#555', font: { size: 9 } }, grid: { display: false } },
        y: { ticks: { color: '#666' },                    grid: { color: '#1c1c35' } },
      },
    },
  });
}

export function drawCompChart(comp) {
  destroy('comp');

  instances.comp = new Chart(document.getElementById('chartComp'), {
    type: 'bar',
    data: {
      labels: Array.from({ length: 49 }, (_, i) => String(i + 1)),
      datasets: [{
        data:            comp.slice(1, 50),
        backgroundColor: '#4895ef99',
        borderColor:     '#4895ef',
        borderWidth:     1,
        borderRadius:    2,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#555', font: { size: 9 } }, grid: { display: false } },
        y: { ticks: { color: '#666' },                    grid: { color: '#1c1c35' } },
      },
    },
  });
}

export function drawReinChart(rein) {
  destroy('rein');
  const maxR = Math.max(...rein);

  instances.rein = new Chart(document.getElementById('chartRein'), {
    type: 'bar',
    data: {
      labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      datasets: [{
        data:            rein,
        backgroundColor: rein.map(v => v === maxR ? '#f4c430' : '#4895ef88'),
        borderWidth:     0,
        borderRadius:    4,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: ([item]) => `Reintegro ${item.label}`,
            label:  item   => `Apariciones: ${item.raw}`,
          },
        },
      },
      scales: {
        x: { ticks: { color: '#aaa' }, grid: { display: false } },
        y: { ticks: { color: '#666' }, grid: { color: '#1c1c35' } },
      },
    },
  });
}
