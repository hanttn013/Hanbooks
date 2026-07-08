import { useRef, useState } from 'react';
import styles from './SettingsScreen.module.css';
import { StorageManager } from '../../utils/StorageManager';
import { APP_THEMES, READER_FONTS, getFontStack, getThemeById } from '../../styles/designTokens';

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

export default function SettingsScreen({ settings, updateSetting, library }) {
  const activeTheme = getThemeById(settings.theme);
  const stats = library?.stats || {};
  const importRef = useRef(null);
  const [backupStatus, setBackupStatus] = useState(() => {
    const timestamp = Number(localStorage.getItem('aurelia_last_backup_at') || 0);
    return timestamp ? `Last backup ${new Date(timestamp).toLocaleString()}` : 'No backup yet';
  });

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Xoa toan bo du lieu ShanBooks? Viec nay se xoa sach da import, bookmarks, lists, tien do doc va cai dat.'
    );
    if (!confirmed) return;

    try {
      await StorageManager.clearAllData();
      Object.keys(localStorage)
        .filter(key => key.startsWith('aurelia_'))
        .forEach(key => localStorage.removeItem(key));
      localStorage.setItem('aurelia_seeded_demo', '1');
      localStorage.setItem('aurelia_seeded_default_lists', '1');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Khong the xoa du lieu. Hay dong va mo lai app roi thu lai.');
    }
  };

  const downloadJson = (payload, fileName) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
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
      const text = await file.text();
      const snapshot = JSON.parse(text);
      const confirmed = window.confirm('Import this ShanBooks backup? Existing library items with the same IDs will be updated.');
      if (!confirmed) return;
      await StorageManager.importLibrarySnapshot(snapshot, { merge: true });
      await StorageManager.createAutoBackup('after-import');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Could not import this backup file.');
    } finally {
      event.target.value = '';
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
                label="Chapter flow"
                value={settings.chapterFlow || 'continuous'}
                options={[
                  { id: 'continuous', label: 'Continuous' },
                  { id: 'manual', label: 'Manual' },
                ]}
                onChange={value => updateSetting('chapterFlow', value)}
              />
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
              <div className={styles.infoRow}><span>Import format</span><em>EPUB</em></div>
              <div className={styles.infoRow}><span>Metadata</span><em>Automatic extraction</em></div>
            </div>
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
                <span>Export library</span>
                <em>JSON</em>
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
            <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={handleImportLibrary} />
            <p className={styles.note}>
              Backups include metadata, progress, bookmarks, lists, and settings. EPUB files are kept separate to avoid huge backup files.
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
