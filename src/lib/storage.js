import { openDB } from 'idb';

const DB_NAME = 'tillair-local';
const DB_VERSION = 2;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sales')) {
      const sales = db.createObjectStore('sales', { keyPath: 'id' });
      sales.createIndex('created_at', 'created_at');
    }
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings', { keyPath: 'key' });
    }
  },
});

export async function getAllSales() {
  const db = await dbPromise;
  return db.getAll('sales');
}

export async function saveSale(sale) {
  const db = await dbPromise;
  await db.put('sales', sale);
  return sale;
}

export async function deleteSale(id) {
  const db = await dbPromise;
  await db.delete('sales', id);
}

export async function getSetting(key, fallback = '') {
  const db = await dbPromise;
  const value = await db.get('settings', key);
  return value?.value ?? fallback;
}

export async function saveSetting(key, value) {
  const db = await dbPromise;
  await db.put('settings', { key, value });
}

export async function clearLocalData() {
  const db = await dbPromise;
  const tx = db.transaction(['sales', 'settings'], 'readwrite');
  await tx.objectStore('sales').clear();
  await tx.objectStore('settings').clear();
  await tx.done;
}
