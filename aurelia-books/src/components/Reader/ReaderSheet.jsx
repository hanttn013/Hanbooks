import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/context';
import styles from './ReaderSheet.module.css';

/**
 * Common Reader Sheet / Tray for TOC, Search, ReaderSettings, and Bookmarks.
 * - Mobile (< 600px): Bottom tray (max-height 85dvh, or low tray <=55dvh for settings).
 * - Desktop/Tablet (>= 600px): Right side panel (360-400px).
 * - Sticky header with title & EdgeAction X close button (no duplicate Close button).
 * - Smooth scrollable body with fade masks.
 * - Hardware Back key / Escape closes the panel first.
 */
export default function ReaderSheet({
  title,
  isOpen = true,
  onClose,
  children,
  isLowTray = false, // for live preview settings <= 55dvh
  noBackdrop = false, // for live typography preview without darkening
  ariaLabel,
}) {
  const { t } = useI18n();
  const panelRef = useRef(null);

  // Close on Escape or hardware back
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-reader-sheet="true"
      className={`${styles.overlay} ${noBackdrop ? styles.noBackdrop : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={`${styles.sheet} ${isLowTray ? styles.lowTray : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle for touch affordance */}
        <div className={styles.grabHandleWrapper}>
          <div className={styles.grabHandle} />
        </div>

        {/* Sticky Header */}
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('Close')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="6" />
            </svg>
          </button>
        </header>

        {/* Scrollable Content Body with fade masks */}
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
}
