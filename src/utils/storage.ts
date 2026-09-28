import { SessionResult, UserSettings } from '../types';
import { DEFAULT_FILLER_WORDS } from './speechTranscriber';

const DB_NAME = 'Presentingo_DB';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_SETTINGS = 'settings';

const DEFAULT_SETTINGS: UserSettings = {
  fillerWords: DEFAULT_FILLER_WORDS,
  autoRecordAudio: true,
  enableSpeechRecognition: true,
  enableMediaPipe: true,
  theme: 'light'
};

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public async saveSession(session: SessionResult): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      store.put(session);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('IndexedDB save failed, falling back to localStorage:', err);
      try {
        const existing = this.getLocalStorageSessions();
        existing.unshift(session);
        localStorage.setItem(STORE_SESSIONS, JSON.stringify(existing));
      } catch (e) {
        console.error('LocalStorage save failed:', e);
      }
    }
  }

  public async getAllSessions(): Promise<SessionResult[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.getAll();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const results: SessionResult[] = request.result || [];
          results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          resolve(results);
        };
        request.onerror = () => resolve(this.getLocalStorageSessions());
      });
    } catch (err) {
      return this.getLocalStorageSessions();
    }
  }

  public async getSessionById(id: string): Promise<SessionResult | null> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const store = tx.objectStore(STORE_SESSIONS);
      const request = store.get(id);

      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch (err) {
      const sessions = this.getLocalStorageSessions();
      return sessions.find((s) => s.id === id) || null;
    }
  }

  public async deleteSession(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      store.delete(id);
    } catch (err) {
      const sessions = this.getLocalStorageSessions().filter((s) => s.id !== id);
      localStorage.setItem(STORE_SESSIONS, JSON.stringify(sessions));
    }
  }

  public async clearAllSessions(): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SESSIONS);
      store.clear();
    } catch (err) {
      localStorage.removeItem(STORE_SESSIONS);
    }
  }

  public async getSettings(): Promise<UserSettings> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const request = store.get('user_settings');

      return new Promise((resolve) => {
        request.onsuccess = () => {
          if (request.result && request.result.value) {
            resolve({ ...DEFAULT_SETTINGS, ...request.result.value });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };
        request.onerror = () => resolve(DEFAULT_SETTINGS);
      });
    } catch (err) {
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: UserSettings): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = tx.objectStore(STORE_SETTINGS);
      store.put({ key: 'user_settings', value: settings });
    } catch (err) {
      localStorage.setItem('user_settings', JSON.stringify(settings));
    }
  }

  private getLocalStorageSessions(): SessionResult[] {
    try {
      const raw = localStorage.getItem(STORE_SESSIONS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
}

export const storage = new StorageService();
