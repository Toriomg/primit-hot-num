const DEFAULTS = { days: '60' };

export function loadSettings() {
  return { days: localStorage.getItem('prim_days') || DEFAULTS.days };
}

export function saveSettings({ days }) {
  localStorage.setItem('prim_days', String(days));
}
