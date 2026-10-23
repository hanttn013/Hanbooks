import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './SettingsScreen.module.css';
import { StorageManager } from '../../utils/StorageManager';
import { APP_THEMES, READER_FONTS, getFontStack, getThemeById } from '../../styles/designTokens';
import { removeShanBooksLocalStorage, STORAGE_KEYS } from '../../utils/storageKeys';

function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <label className={styles.sliderRow}>
      <span>
        <strong>{label}</strong>
        <em>{value}{unit}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

function formatBytes(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function SettingsScreen({ settings, updateSetting, library }) {
  const activeTheme = getThemeById(settings.theme);
  const stats = library?.stats || {};
  const importRef = useRef(null);
  const [backupStatus, setBackupStatus] = useState(() => {
    const timestamp = Number(localStorage.getItem(STORAGE_KEYS.lastBackupAt) || 0);
    return timestamp ? `Last backup ${new Date(timestamp).toLocaleString()}` : 'No backup yet';
  });
  const [storageState, setStorageState] = useState({ usage: 0, quota: 0, persisted: false, supported: true });

  const refreshStorageState = useCallback(async () => {
    if (!navigator.storage) {
      setStorageState(current => ({ ...current, supported: false }));
      return;
    }
    const [estimate, persisted] = await Promise.all([
      navigator.storage.estimate?.() || {},
      navigator.storage.persisted?.() || false,
    ]);
    setStorageState({ usage: estimate.usage || 0, quota: estimate.quota || 0, persisted: Boolean(persisted), supported: true });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      refreshStorageState().catch(() => setStorageState(current => ({ ...current, supported: false })));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshStorageState]);

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Xoa toan bo du lieu ShanBooks? Viec nay se xoa sach da import, bookmarks, lists, tien do doc va cai dat.'
    );
    if (!confirmed) return;

    try {
      await StorageManager.clearAllData();
      removeShanBooksLocalStorage();
      localStorage.setItem(STORAGE_KEYS.seededDemo, '1');
      localStorage.setItem(STORAGE_KEYS.seededDefaultLists, '1');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Khong the xoa du lieu. Hay dong va mo lai app roi thu lai.');
    }
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = (payload, fileName) => {
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), fileName);
  };

  const handleExportLibrary = async () => {
    try {
      const snapshot = await StorageManager.exportLibrarySnapshot();
      const stamp = new Date(snapshot.exportedAt).toISOString().replace(/[:.]/g, '-');
      downloadJson(snapshot, `hanbooks-library-${stamp}.json`);
    } catch (err) {
      alert(err.message || 'Could not export library.');
    }
  };

  const handleImportLibrary = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const confirmed = window.confirm('Import this ShanBooks backup? Existing library items with the same IDs will be updated.');
      if (!confirmed) return;
      if (/\.zip$/i.test(file.name) || file.type === 'application/zip') {
        await StorageManager.importFullBackup(file, { merge: true });
      } else {
        const snapshot = JSON.parse(await file.text());
        await StorageManager.importLibrarySnapshot(snapshot, { merge: true });
      }
      await StorageManager.createAutoBackup('after-import');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Could not import this backup file.');
    } finally {
      event.target.value = '';
    }
  };

  const handleExportFullBackup = async () => {
    try {
      setBackupStatus('Building full backup...');
      const blob = await StorageManager.exportFullBackup();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(blob, `shanbooks-full-${stamp}.zip`);
      setBackupStatus(`Full backup ${formatBytes(blob.size)}`);
    } catch (err) {
      setBackupStatus('Full backup failed');
      alert(err.message || 'Could not create a full backup.');
    }
  };

  const handlePersistStorage = async () => {
    try {
      await navigator.storage?.persist?.();
      await refreshStorageState();
    } catch {
      setStorageState(current => ({ ...current, supported: false }));
    }
  };

  const handleCreateBackup = async () => {
    try {
      const backup = await StorageManager.createAutoBackup('manual');
      setBackupStatus(`Last backup ${new Date(backup.createdAt).toLocaleString()}`);
    } catch (err) {
      alert(err.message || 'Could not create backup.');
    }
  };

  return (
    <div className={styles.screen}>
      <header className={`${styles.header} safe-top`}>
        <div className="brand-lockup">
          <img className="brand-logo" src="/branding/shanbooks-logo.png" alt="" />
          <p className="aurelia-wordmark">ShanBooks</p>
        </div>
        <h1 className="screen-title">Settings</h1>
      </header>

      <div className="screen-scroll">
        <main className={styles.content}>
          <section className={styles.group}>
            <h2>Statistics</h2>
            <div className={styles.statsPanel}>
              <div className={styles.statsGrid}>
                <Stat label="Books" value={stats.totalBooks || 0} />
                <Stat label="Lists" value={stats.totalLists || 0} />
                <Stat label="Reading" value={stats.readingBooks || 0} />
                <Stat label="Storage" value={stats.totalStorageLabel || '0 MB'} />
              </div>
            </div>
          </section>

          <section className={styles.preview} style={{ background: activeTheme.bg, color: activeTheme.text, fontFamily: getFontStack(settings.font), fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>
            She turned the page without thinking, and the story carried her further from the quiet street below.
          </section>

          <section className={styles.group}>
            <h2>Theme</h2>
            <div className={styles.themeGrid}>
              {APP_THEMES.map(theme => (
                <button
                  key={theme.id}
                  className={settings.theme === theme.id ? styles.themeActive : ''}
                  style={{ background: theme.bg, color: theme.text }}
                  onClick={() => updateSetting('theme', theme.id)}
                >
                  <strong>Aa</strong>
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.group}>
            <h2>Typeface</h2>
            <div className={styles.card}>
              {READER_FONTS.map(font => (
                <button
                  key={font.id}
                  className={settings.font === font.id ? styles.rowActive : ''}
                  onClick={() => updateSetting('font', font.id)}
                >
                  <span style={{ fontFamily: font.stack }}>{font.label}</span>
                  <em>{settings.font === font.id ? 'Selected' : 'Aa'}</em>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.group}>
            <h2>Text</h2>
            <div className={styles.card}>
              <Slider label="Font size" value={settings.fontSize} min={14} max={28} unit="px" onChange={v => updateSetting('fontSize', v)} />
              <Slider label="Line height" value={settings.lineHeight} min={1.2} max={2.4} step={0.05} onChange={v => updateSetting('lineHeight', parseFloat(v.toFixed(2)))} />
              <Slider label="Margins" value={settings.marginWidth} min={8} max={48} step={2} unit="px" onChange={v => updateSetting('marginWidth', v)} />
              <Slider label="Letter spacing" value={settings.letterSpacing} min={0} max={3} step={0.25} unit="px" onChange={v => updateSetting('letterSpacing', v)} />
            </div>
          </section>

          <section className={styles.group}>
            <h2>Reading mode</h2>
            <div className={styles.segment}>
              {[
                { id: 'scroll', label: 'Scroll' },
                { id: 'classic', label: 'Pages' },
              ].map(mode => (
                <button
                  key={mode.id}
                  className={settings.readingMode === mode.id ? styles.segmentActive : ''}
                  onClick={() => updateSetting('readingMode', mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.group}>
            <h2>Reader controls</h2>
            <div className={styles.card}>
              <SettingSelect
                label="Status line"
                value={settings.readingStatusLine || 'off'}
                options={[
                  { id: 'off', label: 'Off' },
                  { id: 'minimal', label: 'Minimal' },
                  { id: 'detailed', label: 'Detailed' },
                ]}
                onChange={value => updateSetting('readingStatusLine', value)}
              />
            </div>
          </section>

          <section className={styles.group}>
            <h2>Library</h2>
            <div className={styles.card}>
              <div className={styles.infoRow}><span>Storage</span><em>IndexedDB</em></div>
              <div className={styles.infoRow}><span>Import formats</span><em>EPUB, PDF, DOCX, TXT/MD/HTML, PPTX, CBZ</em></div>
              <div className={styles.infoRow}><span>Metadata</span><em>Automatic extraction</em></div>
              <div className={styles.infoRow}>
                <span>Browser quota</span>
                <em>{storageState.supported ? `${formatBytes(storageState.usage)} / ${formatBytes(storageState.quota)}` : 'Unavailable'}</em>
              </div>
              <div className={styles.infoRow}><span>Offline protection</span><em>{storageState.persisted ? 'Persistent' : 'Best effort'}</em></div>
              {!storageState.persisted && storageState.supported && (
                <button onClick={handlePersistStorage}><span>Protect offline library</span><em>Request</em></button>
              )}
            </div>
            {storageState.quota > 0 && storageState.usage / storageState.quota >= 0.8 && (
              <p className={styles.note}>Storage is over 80% full. Export a full backup before importing more large documents.</p>
            )}
          </section>

          <section className={styles.group}>
            <h2>Metadata Queue</h2>
            <div className={styles.card}>
              <div className={styles.infoRow}>
                <span>Pending books</span>
                <em>{library?.pendingMetadataTotal || 0}</em>
              </div>
              <div className={styles.infoRow}>
                <span>Queue status</span>
                <em>
                  {library?.metadataProcessingCount > 0
                    ? `Processing ${library.metadataProcessingCount}...`
                    : library?.isMetadataQueuePaused ? 'Paused' : 'Idle'}
                </em>
              </div>
              <div className={styles.infoRow}>
                <span>Failed books</span>
                <em>{library?.failedMetadataTotal || 0}</em>
              </div>
              {library?.pendingMetadataTotal > 0 && (
                <button onClick={() => library.setIsMetadataQueuePaused(prev => !prev)}>
                  <span>{library?.isMetadataQueuePaused ? 'Resume queue' : 'Pause queue'}</span>
                  <em>{library?.isMetadataQueuePaused ? 'Play' : 'Pause'}</em>
                </button>
              )}
            </div>
            <p className={styles.note}>
              ShanBooks extracts cover and info in the background to keep imports fast. You can pause this if your device slows down.
            </p>
          </section>

          <section className={styles.group}>
            <h2>Backup</h2>
            <div className={styles.card}>
              <button onClick={handleExportLibrary}>
                <span>Export data only</span>
                <em>JSON · no files</em>
              </button>
              <button onClick={handleExportFullBackup}>
                <span>Export full library</span>
                <em>ZIP · includes files</em>
              </button>
              <button onClick={() => importRef.current?.click()}>
                <span>Import library</span>
                <em>Merge</em>
              </button>
              <button onClick={handleCreateBackup}>
                <span>Create auto backup</span>
                <em>Now</em>
              </button>
              <div className={styles.infoRow}><span>Auto backup</span><em>{backupStatus}</em></div>
            </div>
            <input ref={importRef} type="file" accept="application/json,application/zip,.json,.zip" hidden onChange={handleImportLibrary} />
            <p className={styles.note}>
              Data-only backups are small but need files to be re-imported. Full backups include original documents and restore them ready to read. ShanBooks retains the latest three automatic snapshots.
            </p>
          </section>

          <section className={styles.group}>
            <h2>Danger zone</h2>
            <div className={styles.card}>
              <button className={styles.dangerRow} onClick={handleClearData}>
                <span>Delete all app data</span>
                <em>Reset</em>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.statBox}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SettingSelect({ label, value, options, onChange }) {
  return (
    <label className={styles.infoRow}>
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
