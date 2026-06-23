const DB_NAME = 'PaperZero';
const DB_VERSION = 1;
const STORE_NAME = 'employeeProfiles';

export interface EmployeeProfile {
  employeeId: string;
  phone: string;
  lastUsed: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'employeeId' });
        store.createIndex('lastUsed', 'lastUsed', { unique: false });
      }
    };
  });
}

export async function getEmployeeProfile(employeeId?: string): Promise<EmployeeProfile | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    if (employeeId) {
      const request = store.get(employeeId.trim());
      request.onsuccess = () => resolve((request.result as EmployeeProfile | undefined) ?? null);
      request.onerror = () => reject(request.error);
      return;
    }

    const index = store.index('lastUsed');
    const request = index.openCursor(null, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      resolve(cursor ? (cursor.value as EmployeeProfile) : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveEmployeeProfile(profile: { employeeId: string; phone: string }): Promise<void> {
  const db = await openDb();
  const record: EmployeeProfile = {
    employeeId: profile.employeeId.trim(),
    phone: profile.phone.trim(),
    lastUsed: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
