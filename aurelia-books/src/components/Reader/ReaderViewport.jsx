// src/components/Reader/ReaderViewport.jsx
import React from 'react';
import { useI18n } from '../../i18n/context';
import styles from './ReaderViewport.module.css';

/**
 * ReaderViewport wraps the rendition/content surface.
 * Guarantees:
 * 1. Safe-area insets at top and bottom filled with reader theme background.
 * 2. Text strictly clipped at safe boundaries (never under status bar icons or gesture navigation bar).
 * 3. Mini footer ("Chương IV · 55%") when chrome is hidden (enabled by default).
 * 4. Three-zone tap layout: Left = Prev / Hide, Center = Toggle Chrome, Right = Next / Hide.
 */
export default function ReaderViewport({
  children,
  themeBg,
  themeText,
  isChromeVisible = false,
  showMiniFooter = true,
  chapterTitle = '',
  progressPercent = 0,
  readingMode = 'scroll', // 'scroll' | 'classic'
  useTapOverlay = false,
  onPrev,
  onNext,
  onToggleChrome,
}) {
  const { t } = useI18n();

  const handleZoneClick = (zone) => {
    if (zone === 'center') {
      onToggleChrome?.();
      return;
    }
    if (readingMode === 'classic') {
      if (zone === 'left') onPrev?.();
      else if (zone === 'right') onNext?.();
    } else {
      // In scroll mode, clicking edges hides chrome if visible
      if (isChromeVisible) onToggleChrome?.(false);
    }
  };

  const footerText = chapterTitle
    ? `${chapterTitle} · ${Math.round(progressPercent)}%`
    : `${Math.round(progressPercent)}%`;

  return (
    <div
      className={styles.viewportContainer}
      style={{
        '--reader-bg': themeBg,
        '--reader-text': themeText,
        backgroundColor: themeBg,
      }}
      data-reader-viewport="true"
    >
      {/* 1. Safe-area top barrier (Prevents text scrolling under status bar) */}
      <div className={styles.safeTopBarrier} aria-hidden="true" />

      {/* 2. Scroll/Render area strictly between safe insets */}
      <div className={styles.contentArea}>
        {children}

        {/* 3-zone tap overlay (optional, used when document does not handle its own taps) */}
        {useTapOverlay && (
          <div className={styles.tapOverlay} aria-hidden="true">
            <div
              className={styles.tapZoneLeft}
              onClick={() => handleZoneClick('left')}
              data-zone="left"
            />
            <div
              className={styles.tapZoneCenter}
              onClick={() => handleZoneClick('center')}
              data-zone="center"
            />
            <div
              className={styles.tapZoneRight}
              onClick={() => handleZoneClick('right')}
              data-zone="right"
            />
          </div>
        )}
      </div>

      {/* 3. Subtle Mini Footer when Chrome is hidden (Accessible button for Show reader controls) */}
      {!isChromeVisible && showMiniFooter && (
        <button
          type="button"
          className={styles.miniFooter}
          onClick={() => onToggleChrome?.(true)}
          aria-label={t('Show reader controls')}
          title={footerText}
        >
          <span className={styles.miniFooterText}>{footerText}</span>
        </button>
      )}

      {/* 4. Safe-area bottom barrier (Prevents text scrolling under gesture bar) */}
      <div className={styles.safeBottomBarrier} aria-hidden="true" />
    </div>
  );
}
