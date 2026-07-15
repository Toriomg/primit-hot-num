const KEYS = {
  apiKey:  'prim_key',
  apiBase: 'prim_base',
  proxy:   'prim_proxy',
  days:    'prim_days',
};

const DEFAULTS = {
  apiKey:  '',
  apiBase: 'https://api.loteriasapi.com/api/v1',
  proxy:   'https://corsproxy.io/?url=',
  days:    '60',
};

export function loadSettings() {
  return {
    apiKey:  localStorage.getItem(KEYS.apiKey)  || DEFAULTS.apiKey,
    apiBase: localStorage.getItem(KEYS.apiBase) || DEFAULTS.apiBase,
    proxy:   localStorage.getItem(KEYS.proxy)   || DEFAULTS.proxy,
    days:    localStorage.getItem(KEYS.days)     || DEFAULTS.days,
  };
}

export function saveSettings({ apiKey, apiBase, proxy, days }) {
  localStorage.setItem(KEYS.apiKey,  apiKey);
  localStorage.setItem(KEYS.apiBase, apiBase);
  localStorage.setItem(KEYS.proxy,   proxy);
  localStorage.setItem(KEYS.days,    String(days));
}
