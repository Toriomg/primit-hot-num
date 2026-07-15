const DB_NAME = 'primitiva';
const DB_VER  = 1;
const STORE   = 'draws';

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const store = e.target.result.createObjectStore(STORE, { keyPath: 'date' });
      store.createIndex('date', 'date', { unique: true });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

export function getLastDate(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly')
                  .objectStore(STORE)
                  .index('date')
                  .openCursor(null, 'prev');
    req.onsuccess = e => resolve(e.target.result?.value?.date ?? null);
    req.onerror   = e => reject(e.target.error);
  });
}

export function insertDraws(db, draws) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const d of draws) store.put(d);
    tx.oncomplete = () => resolve();
    tx.onerror    = e => reject(e.target.error);
  });
}

export function getAllDraws(db) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    req.onsuccess = e =>
      resolve(e.target.result.sort((a, b) => b.date.localeCompare(a.date)));
    req.onerror   = e => reject(e.target.error);
  });
}
