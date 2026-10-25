// src/components/Settings/SettingsScreen.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Choice, Range } from '../UI/Controls';
import { ToastQueue } from '@react-spectrum/s2/Toast';
import Button from '../Common/Button';
import { AlertDialog, DialogTrigger } from '@react-spectrum/s2/AlertDialog';
import { useI18n } from '../../i18n/context';
import { useConfirm } from '../UI/feedbackContext';
import { StorageManager } from '../../utils/StorageManager';
import { APP_THEMES, READER_FONTS, getFontStack, getThemeById } from '../../styles/designTokens';
import { removeShanBooksLocalStorage, STORAGE_KEYS } from '../../utils/storageKeys';
import PageHeader from '../Common/PageHeader';
import styles from './SettingsScreen.module.css';

function formatBytes(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function SettingsScreen({ settings, updateSetting, resetSettings, library }) {
  const { t, locale } = useI18n();
  const confirm = useConfirm();
  const activeTheme = getThemeById(settings.theme);
  const stats = library?.stats || {};
  const importRef = useRef(null);
  const [deleteStep, setDeleteStep] = useState(null); // null | 1 | 2
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

  // Execute two-step confirmed complete data deletion
  const executeClearData = async () => {
    setDeleteStep(null);
    try {
      await StorageManager.clearAllData();
      removeShanBooksLocalStorage();
      localStorage.setItem(STORAGE_KEYS.seededDemo, '1');
      localStorage.setItem(STORAGE_KEYS.seededDefaultLists, '1');
      window.location.reload();
    } catch (err) {
      ToastQueue.negative(t(err.message || 'Could not delete data. Please restart the app and try again.'));
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
      downloadJson(snapshot, `shanbooks-library-${stamp}.json`);
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

  const handleResetSettings = async () => {
    const ok = await confirm({
      title: t('Reset settings'),
      message: t('Reset settings to default?'),
      confirmText: t('Reset'),
      destructive: true,
    });
    if (!ok) return;
    resetSettings?.();
    ToastQueue.positive(t('Settings reset to default'));
  };

  const formattedBackupTime = backupStatus.at
    ? new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(backupStatus.at)
    : '';

  return (
    <div className={styles.screen}>
      <PageHeader title={t('Settings')} />
      <div className={`${styles.scrollArea} screen-scroll`}>
        <div className={styles.container}>
          {/* 1. Giao diện (Application Appearance & Language) */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('Application')}</h2>
            </div>
            <div className={styles.fieldsGrid}>
              <Choice
                label="App appearance"
                value={settings.appTheme}
                onChange={value => updateSetting('appTheme', value)}
                options={[
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'system', label: 'System' },
                ]}
              />
              <Choice
                label="Language"
                value={settings.language}
                onChange={value => updateSetting('language', value)}
                options={[
                  { id: 'vi', label: 'Tiếng Việt' },
                  { id: 'en', label: 'English' },
                ]}
              />
            </div>
          </section>

          {/* 2. Thống kê (Library Statistics) */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('Statistics')}</h2>
            </div>
            <div className={styles.statsGrid}>
              {[
                [t('Books'), stats.totalBooks || 0],
                [t('Lists'), stats.totalLists || 0],
                [t('Reading'), stats.readingBooks || 0],
                [t('Storage'), stats.totalStorageLabel || '0 MB'],
              ].map(([label, value]) => (
                <div className={styles.statItem} key={label}>
                  <span className={styles.statValue}>{value}</span>
                  <span className={styles.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Cài đặt đọc (Reader Settings) */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('Reader settings')}</h2>
            </div>
            <div
              className={styles.previewBox}
              aria-label={t('Reading preference preview')}
              style={{
                background: activeTheme.bg,
                color: activeTheme.text,
                fontFamily: getFontStack(settings.font),
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
              }}
            >
              {t('previewText')}
            </div>
            <div className={styles.fieldsGrid}>
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

          {/* 4. Sao lưu (Backup & Restore & Storage Health) */}
          <section className={styles.card}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{t('Backup')}</h2>
            </div>
            <p className={styles.sectionDesc}>{t('backupNote')}</p>

            {/* S2 Button 2-column Grid, aligned flush with section padding (deviation <= 1px) */}
            <div className={styles.backupGrid}>
              <Button
                variant="secondary"
                size="M"
                onPress={handleExportLibrary}
                styles={{ width: '100%' }}
              >
                {t('Export data only')}
              </Button>

              <Button
                variant="accent"
                size="M"
                onPress={handleExportFullBackup}
                isDisabled={backupStatus.key === 'Building full backup...'}
                styles={{ width: '100%' }}
              >
                {t('Export full library')}
              </Button>

              <Button
                variant="secondary"
                size="M"
                onPress={() => importRef.current?.click()}
                styles={{ width: '100%' }}
              >
                {t('Import library')}
              </Button>

              <Button
                variant="secondary"
                size="M"
                onPress={handleCreateBackup}
                styles={{ width: '100%' }}
              >
                {t('Create auto backup')}
              </Button>
            </div>

            {/* Non-repeating backup status row */}
            <p className={styles.backupStatusRow} role="status">
              {backupStatus.at
                ? t('Last backup', { date: formattedBackupTime })
                : backupStatus.size
                  ? t('Full backup size', { size: backupStatus.size })
                  : t(backupStatus.key)}
            </p>

            <input
              aria-label={t('Import library')}
              ref={importRef}
              type="file"
              accept="application/json,application/zip,.json,.zip"
              hidden
              onChange={handleImportLibrary}
            />

            {/* Offline storage & Queue summary within Backup section */}
            <div className={styles.subCard}>
              <div className={styles.subHeader}>
                <span className={styles.subTitle}>{t('Offline storage')}</span>
                <span className={styles.subMeta}>
                  {formatBytes(storageState.usage)} / {formatBytes(storageState.quota)}
                </span>
              </div>
              <p className={styles.subDesc}>
                {t(storageState.persisted ? 'Protected' : storageState.supported ? 'Best effort' : 'Not available')}
              </p>
              <div>
                <Button
                  variant="secondary"
                  size="S"
                  onPress={handlePersistStorage}
                >
                  {t('Protect offline library')}
                </Button>
              </div>
              {storageState.quota > 0 && storageState.usage / storageState.quota >= 0.8 && (
                <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '6px 0 0' }}>
                  {t('quotaWarning')}
                </p>
              )}
            </div>

            {library?.pendingMetadataTotal > 0 && (
              <div className={styles.subCard}>
                <div className={styles.subHeader}>
                  <span className={styles.subTitle}>{t('Metadata Queue')}</span>
                  <span className={styles.subMeta}>
                    {library.pendingMetadataTotal} {t('Pending books').toLowerCase()}
                  </span>
                </div>
                <p className={styles.subDesc}>{t('queueNote')}</p>
                <div>
                  <Button
                    variant="secondary"
                    size="S"
                    onPress={() => library.setIsMetadataQueuePaused(previous => !previous)}
                  >
                    {t(library.isMetadataQueuePaused ? 'Resume queue' : 'Pause queue')}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* 5. Nguy hiểm (Danger Zone) */}
          <section className={`${styles.card} ${styles.dangerCard}`}>
            <div className={styles.sectionHeader}>
              <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>
                {t('Danger zone')}
              </h2>
            </div>
            <div className={styles.dangerActions}>
              {/* Reset settings: Secondary with red border */}
              <Button
                variant="secondary"
                size="L"
                styles={{ width: '100%' }}
                UNSAFE_className={`${styles.resetBtn} btn-destructive-outline`}
                onPress={handleResetSettings}
              >
                {t('Reset settings')}
              </Button>

              {/* Delete all data: Destructive solid + 2-step AlertDialog */}
              <Button
                variant="negative"
                size="L"
                styles={{ width: '100%' }}
                UNSAFE_className="btn-destructive"
                onPress={() => setDeleteStep(1)}
              >
                {t('Delete all app data')}
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* 2-Step Native Spectrum AlertDialogs */}
      <DialogTrigger
        isOpen={deleteStep === 1}
        onOpenChange={(open) => !open && setDeleteStep(null)}
      >
        <span />
        <AlertDialog
          variant="destructive"
          title={t('Delete all app data')}
          cancelLabel={t('Cancel')}
          primaryActionLabel={t('Continue')}
          onPrimaryAction={() => setDeleteStep(2)}
          onCancel={() => setDeleteStep(null)}
        >
          {t('deleteDataConfirm')}
        </AlertDialog>
      </DialogTrigger>

      <DialogTrigger
        isOpen={deleteStep === 2}
        onOpenChange={(open) => !open && setDeleteStep(null)}
      >
        <span />
        <AlertDialog
          variant="destructive"
          title={t('Final Confirmation')}
          cancelLabel={t('Cancel')}
          primaryActionLabel={t('Delete all app data')}
          onPrimaryAction={executeClearData}
          onCancel={() => setDeleteStep(null)}
        >
          {t('All books and reading progress will be permanently erased. Are you absolutely certain?')}
        </AlertDialog>
      </DialogTrigger>
    </div>
  );
}
