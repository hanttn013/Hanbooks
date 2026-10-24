import { useCallback, useEffect, useRef, useState } from 'react';
import { Action, Choice, Range } from '../UI/Controls';
import { ToastQueue } from '@react-spectrum/s2/Toast';
import { useI18n } from '../../i18n/context';
import { useConfirm } from '../UI/feedbackContext';
import { StorageManager } from '../../utils/StorageManager';
import { APP_THEMES, READER_FONTS, getFontStack, getThemeById } from '../../styles/designTokens';
import { removeShanBooksLocalStorage, STORAGE_KEYS } from '../../utils/storageKeys';

function formatBytes(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function SettingsScreen({ settings, updateSetting, library }) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const activeTheme = getThemeById(settings.theme);
  const stats = library?.stats || {};
  const importRef = useRef(null);
  const [backupStatus, setBackupStatus] = useState(() => {
    const timestamp = Number(localStorage.getItem(STORAGE_KEYS.lastBackupAt) || 0);
    return timestamp ? { key: 'Last backup', at: timestamp } : { key: 'No backup yet' };
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
    const confirmed = await confirm(t('deleteDataConfirm'));
    if (!confirmed) return;

    try {
      await StorageManager.clearAllData();
      removeShanBooksLocalStorage();
      localStorage.setItem(STORAGE_KEYS.seededDemo, '1');
      localStorage.setItem(STORAGE_KEYS.seededDefaultLists, '1');
      window.location.reload();
    } catch (err) {
      ToastQueue.negative(t(err.message || 'Khong the xoa du lieu. Hay dong va mo lai app roi thu lai.'));
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
      ToastQueue.negative(t(err.message || 'Could not export library.'));
    }
  };

  const handleImportLibrary = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const confirmed = await confirm(t('importBackupConfirm'));
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
      ToastQueue.negative(t(err.message || 'Could not import this backup file.'));
    } finally {
      event.target.value = '';
    }
  };

  const handleExportFullBackup = async () => {
    try {
      setBackupStatus({ key: 'Building full backup...' });
      const blob = await StorageManager.exportFullBackup();
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadBlob(blob, `shanbooks-full-${stamp}.zip`);
      setBackupStatus({ key: 'Full backup size', size: formatBytes(blob.size) });
    } catch (err) {
      setBackupStatus({ key: 'Full backup failed' });
      ToastQueue.negative(t(err.message || 'Could not create a full backup.'));
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
      setBackupStatus({ key: 'Last backup', at: backup.createdAt });
    } catch (err) {
      ToastQueue.negative(t(err.message || 'Could not create backup.'));
    }
  };

  return <div className="screen-container">
    <header className="page-layout safe-top" style={{ paddingBottom: 0, gap: 12 }}><p className="aurelia-wordmark">ShanBooks</p><h1 className="screen-title">{t('Settings')}</h1></header>
    <div className="screen-scroll"><main className="page-layout">
      <section className="settings-section"><h2>{t('Application')}</h2><div className="field-grid">
        <Choice label="App appearance" value={settings.appTheme} onChange={value => updateSetting('appTheme', value)} options={[{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'system', label: 'System' }]} />
        <Choice label="Language" value={settings.language} onChange={value => updateSetting('language', value)} options={[{ id: 'vi', label: 'Tiếng Việt' }, { id: 'en', label: 'English' }]} />
      </div></section>
      <section className="settings-section"><h2>{t('Statistics')}</h2><div className="stats-grid">
        {[[t('Books'), stats.totalBooks || 0], [t('Lists'), stats.totalLists || 0], [t('Reading'), stats.readingBooks || 0], [t('Storage'), stats.totalStorageLabel || '0 MB']].map(([label, value]) => <div className="stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </div></section>
      <section className="settings-section"><h2>{t('Reader settings')}</h2>
        <div aria-label={t('Reading preference preview')} style={{ padding: 24, borderRadius: 8, background: activeTheme.bg, color: activeTheme.text, fontFamily: getFontStack(settings.font), fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>{t('previewText')}</div>
        <div className="field-grid">
          <Choice label="Reader theme" value={settings.theme} onChange={value => updateSetting('theme', value)} options={APP_THEMES} />
          <Choice label="Typeface" value={settings.font} onChange={value => updateSetting('font', value)} options={READER_FONTS} />
          <Choice label="Reading mode" value={settings.readingMode} onChange={value => updateSetting('readingMode', value)} options={[{ id: 'scroll', label: 'Scroll' }, { id: 'classic', label: 'Pages' }]} />
          <Choice label="Status line" value={settings.readingStatusLine} onChange={value => updateSetting('readingStatusLine', value)} options={[{ id: 'off', label: 'Off' }, { id: 'minimal', label: 'Minimal' }, { id: 'detailed', label: 'Detailed' }]} />
          <Range label="Font size" value={settings.fontSize} min={14} max={28} onChange={value => updateSetting('fontSize', value)} />
          <Range label="Line height" value={settings.lineHeight} min={1.2} max={2.4} step={0.05} onChange={value => updateSetting('lineHeight', value)} />
          <Range label="Margins" value={settings.marginWidth} min={8} max={48} step={2} onChange={value => updateSetting('marginWidth', value)} />
          <Range label="Letter spacing" value={settings.letterSpacing} min={0} max={3} step={0.25} onChange={value => updateSetting('letterSpacing', value)} />
        </div>
      </section>
      <section className="settings-section"><h2>{t('Offline storage')}</h2>
        <p>{t('Browser quota')}: {formatBytes(storageState.usage)} / {formatBytes(storageState.quota)} · {t(storageState.persisted ? 'Protected' : storageState.supported ? 'Best effort' : 'Not available')}</p>
        <div><Action onPress={handlePersistStorage}>{t('Protect offline library')}</Action></div>
        {storageState.quota > 0 && storageState.usage / storageState.quota >= 0.8 && <p role="alert">{t('quotaWarning')}</p>}
      </section>
      <section className="settings-section"><h2>{t('Metadata Queue')}</h2>
        <p>{t('Pending books')}: {library?.pendingMetadataTotal || 0} · {t('Failed books')}: {library?.failedMetadataTotal || 0} · {t('Queue status')}: {library?.metadataProcessingCount || 0} / {t(library?.isMetadataQueuePaused ? 'Paused' : 'Idle')}</p>
        <p>{t('queueNote')}</p>
        {library?.pendingMetadataTotal > 0 && <div><Action onPress={() => library.setIsMetadataQueuePaused(previous => !previous)}>{t(library.isMetadataQueuePaused ? 'Resume queue' : 'Pause queue')}</Action></div>}
      </section>
      <section className="settings-section"><h2>{t('Backup')}</h2><p>{t('backupNote')}</p>
        <div className="action-row">
          <Action onPress={handleExportLibrary}>{t('Export data only')}</Action>
          <Action primary onPress={handleExportFullBackup} isPending={backupStatus.key === 'Building full backup...'}>{t('Export full library')}</Action>
          <Action onPress={() => importRef.current?.click()}>{t('Import library')}</Action>
          <Action onPress={handleCreateBackup}>{t('Create auto backup')}</Action>
        </div>
        <p role="status">{t('Auto backup')}: {t(backupStatus.key, { size: backupStatus.size, date: backupStatus.at ? new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'short', timeStyle: 'short' }).format(backupStatus.at) : '' })}</p>
        <input aria-label={t('Import library')} ref={importRef} type="file" accept="application/json,application/zip,.json,.zip" hidden onChange={handleImportLibrary} />
        <small>{new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(new Date())}</small>
      </section>
      <section className="settings-section"><h2>{t('Danger zone')}</h2><div><Action negative onPress={handleClearData}>{t('Delete all app data')}</Action></div></section>
    </main></div>
  </div>;
}
