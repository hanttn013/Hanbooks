export const STORAGE_KEYS = Object.freeze({
  settings: 'shanbooks_settings',
  stats: 'shanbooks_stats',
  sort: 'shanbooks_sort',
  metadataPaused: 'shanbooks_metadata_paused',
  seededDemo: 'shanbooks_seeded_demo',
  seededDefaultLists: 'shanbooks_seeded_default_lists',
  lastBackupAt: 'shanbooks_last_backup_at',
  legacyProgress: 'shanbooks_progress',
  migrationVersion: 'shanbooks_storage_migration',
});

const LEGACY_KEYS = Object.freeze({
  aurelia_settings: STORAGE_KEYS.settings,
  aurelia_stats: STORAGE_KEYS.stats,
  aurelia_sort: STORAGE_KEYS.sort,
  aurelia_metadata_paused: STORAGE_KEYS.metadataPaused,
  aurelia_seeded_demo: STORAGE_KEYS.seededDemo,
  aurelia_seeded_default_lists: STORAGE_KEYS.seededDefaultLists,
  aurelia_last_backup_at: STORAGE_KEYS.lastBackupAt,
  aurelia_progress: STORAGE_KEYS.legacyProgress,
});

const OLD_PROGRESS_PREFIX = 'aurelia_pct_';
const NEW_PROGRESS_PREFIX = 'shanbooks_pct_';

export function progressStorageKey(bookId) {
  return `${NEW_PROGRESS_PREFIX}${bookId}`;
}

export function readProgressPercent(book, storage = localStorage) {
  const fallback = book?.status === 'finished' ? 100 : 0;
  return Number.parseFloat(storage.getItem(progressStorageKey(book?.id)) || fallback);
}

export function migrateLegacyLocalStorage(storage = globalThis.localStorage) {
  if (!storage) return { copied: 0, removed: 0 };
  let copied = 0;
  let removed = 0;
  const migrations = Object.entries(LEGACY_KEYS);
  const dynamicKeys = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(OLD_PROGRESS_PREFIX)) {
      dynamicKeys.push([key, `${NEW_PROGRESS_PREFIX}${key.slice(OLD_PROGRESS_PREFIX.length)}`]);
    }
  }

  for (const [oldKey, newKey] of [...migrations, ...dynamicKeys]) {
    const oldValue = storage.getItem(oldKey);
    if (oldValue === null) continue;
    if (storage.getItem(newKey) === null) {
      storage.setItem(newKey, oldValue);
      copied += 1;
    }
    storage.removeItem(oldKey);
    removed += 1;
  }

  storage.setItem(STORAGE_KEYS.migrationVersion, '1');
  return { copied, removed };
}

export function removeShanBooksLocalStorage(storage = localStorage) {
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith('shanbooks_') || key?.startsWith('aurelia_')) keys.push(key);
  }
  keys.forEach(key => storage.removeItem(key));
}
