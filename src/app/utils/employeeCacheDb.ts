import type { Employee } from '../types';

const DB_NAME = 'PaperZero';
const DB_VERSION = 2;
const PROFILE_STORE = 'employeeProfiles';
const DETAIL_STORE = 'employeeDetails';
const CACHE_TTL_MS = 15 * 60 * 1000;

interface CachedEmployee {
  employeeId: string;
  employee: Employee;
  cachedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        const store = db.createObjectStore(PROFILE_STORE, { keyPath: 'employeeId' });
        store.createIndex('lastUsed', 'lastUsed', { unique: false });
      }
      if (!db.objectStoreNames.contains(DETAIL_STORE)) {
        db.createObjectStore(DETAIL_STORE, { keyPath: 'employeeId' });
      }
    };
  });
}

export async function getCachedEmployee(employeeId: string): Promise<Employee | null> {
  const id = employeeId.trim();
  if (!id) return null;
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DETAIL_STORE, 'readonly');
      const request = tx.objectStore(DETAIL_STORE).get(id);
      request.onsuccess = () => {
        const row = request.result as CachedEmployee | undefined;
        if (!row?.employee) {
          resolve(null);
          return;
        }
        if (Date.now() - row.cachedAt > CACHE_TTL_MS) {
          resolve(null);
          return;
        }
        resolve(row.employee);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function setCachedEmployee(employee: Employee): Promise<void> {
  const id = String(employee.id || '').trim();
  if (!id) return;
  try {
    const db = await openDb();
    const record: CachedEmployee = {
      employeeId: id,
      employee,
      cachedAt: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DETAIL_STORE, 'readwrite');
      const request = tx.objectStore(DETAIL_STORE).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // ignore IDB write failures
  }
}
