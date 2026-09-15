'use client';

const DATABASE_NAME = 'aipj-browser-storage';
const DATABASE_VERSION = 1;
const STORE_NAME = 'key-value';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB를 사용할 수 없습니다.'));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error || new Error('IndexedDB 열기에 실패했습니다.'));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function readIndexedDb(key) {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(key);
      request.onerror = () => reject(request.error || new Error('IndexedDB 읽기에 실패했습니다.'));
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
    });
  } finally {
    database.close();
  }
}

async function writeIndexedDb(key, value) {
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB 쓰기에 실패했습니다.'));
      transaction.oncomplete = () => resolve();
      transaction.objectStore(STORE_NAME).put(value, key);
    });
  } finally {
    database.close();
  }
}

async function removeIndexedDb(key) {
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB 삭제에 실패했습니다.'));
      transaction.oncomplete = () => resolve();
      transaction.objectStore(STORE_NAME).delete(key);
    });
  } finally {
    database.close();
  }
}

export async function readBrowserChatStorage(key) {
  try {
    const localValue = window.localStorage?.getItem(key);
    if (localValue) {
      return localValue;
    }
  } catch {
    // localStorage가 차단된 환경에서는 IndexedDB로 대체한다.
  }

  return readIndexedDb(key).catch(() => null);
}

export async function writeBrowserChatStorage(key, value) {
  try {
    const storage = window.localStorage;
    if (!storage) {
      throw new Error('localStorage를 사용할 수 없습니다.');
    }
    storage.setItem(key, value);
    return;
  } catch {
    // localStorage가 차단된 환경에서는 IndexedDB로 대체한다.
  }

  await writeIndexedDb(key, value);
}

export async function removeBrowserChatStorage(key) {
  try {
    window.localStorage?.removeItem(key);
  } catch {
    // IndexedDB 정리를 계속 시도한다.
  }

  await removeIndexedDb(key).catch(() => {});
}
