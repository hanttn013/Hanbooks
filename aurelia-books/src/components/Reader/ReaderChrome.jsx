// src/components/Reader/ReaderChrome.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '../../i18n/context';
import styles from './ReaderChrome.module.css';

/**
 * Unified Reader Chrome (Top Bar + Bottom Bar + Menu ⋯ + Toast)
 * Conforms to:
 * - Top Bar: Symmetrical Back and ⋯ buttons (40dp visual, 44dp touch target), truly centered title (<=2px offset).
 * - Bottom Bar: Single bar without nested cards.
 *   Row 1: High-contrast progress bar (read portion accent, unread >= 3:1, 20-24dp thumb with border, 44dp touch target).
 *   Row 2: 4 equal-width tools (+-1px): Bookmark, Notes/Bookmarks, Typography (Aa), TOC.
 * - Menu ⋯: Anchored popover, right-aligned, within screen bounds (220dp to screen-32dp), icon + text + count.
 * - Toast: Above bottom bar, role="status", aria-live="polite", includes Undo for bookmark removal.
 * - Auto-hides after reading pause with 200ms transition.
 */
export default function ReaderChrome({
  bookTitle = '',
  chapterTitle = '',
  percentage = 0,
  pageInfo = null, // e.g. "12 / 120" for PDF/PPTX
  format = 'epub',
  locationsReady = true,
  isBookmarked = false,
  bookmarksCount = 0,
  isVisible = true,
  onClose,
  onToggleBookmark,
  onOpenBookmarks,
  onOpenSettings,
  onOpenTOC,
  onOpenSearch,
  onSeekChange,
  onSeekCommit,
  previousLocation = null,
  onJumpToPrevious,
  themeBg = '#FAF7F2',
  themeText = '#141312',
}) {
  const { t } = useI18n();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(percentage);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastUndoAction, setToastUndoAction] = useState(null);
  const toastTimerRef = useRef(null);
  const moreBtnRef = useRef(null);
  const menuRef = useRef(null);

  // Close more menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && !moreBtnRef.current?.contains(e.target)) {
        setShowMoreMenu(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowMoreMenu(false);
    };
    window.addEventListener('pointerdown', handleClickOutside, true);
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside, true);
      window.removeEventListener('keydown', handleKey, true);
    };
  }, [showMoreMenu]);

  // Trigger toast notification
  const showToast = useCallback((message, undoAction = null) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    setToastUndoAction(() => undoAction);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      setToastUndoAction(null);
    }, 3200);
  }, []);

  const handleBookmarkClick = async () => {
    const wasBookmarked = isBookmarked;
    await onToggleBookmark?.();
    if (wasBookmarked) {
      showToast(t('Bookmark removed'), () => onToggleBookmark?.());
    } else {
      showToast(t('Bookmark added'));
    }
  };

  const handleSliderPointerDown = (e) => {
    if (!locationsReady) return;
    setIsScrubbing(true);
    const val = Number(e.target.value);
    setScrubValue(val);
    onSeekChange?.(val);
  };

  const handleSliderInput = (e) => {
    if (!locationsReady) return;
    const val = Number(e.target.value);
    setScrubValue(val);
    onSeekChange?.(val);
  };

  const handleSliderCommit = (e) => {
    if (!locationsReady) return;
    const val = Number(e.target.value);
    setIsScrubbing(false);
    onSeekCommit?.(val);
  };

  const currentDisplayPct = Math.round(isScrubbing ? scrubValue : percentage);
  const displayLabel = pageInfo || (locationsReady ? `${currentDisplayPct}%` : t('Calculating positions…'));

  return (
    <div
      className={`${styles.chromeRoot} ${!isVisible ? styles.chromeHidden : ''}`}
      style={{
        '--reader-bg': themeBg,
        '--reader-text': themeText,
      }}
      data-reader-chrome="true"
    >
      {/* ================= TOP BAR ================= */}
      <header className={styles.topBar}>
        {/* Symmetrical Left Slot: Back Button (40dp visual, 44dp touch target) */}
        <div className={styles.buttonSlot}>
          <button
            type="button"
            className={styles.circleBtn}
            onClick={onClose}
            aria-label={t('Close reader')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* True-Centered Title Slot (Left and Right slots have equal width 44px) */}
        <div className={styles.titleSlot}>
          {bookTitle && <span className={styles.bookTitle}>{bookTitle}</span>}
          <h1 className={styles.chapterTitle}>{chapterTitle || t('Reader')}</h1>
        </div>

        {/* Symmetrical Right Slot: More ⋯ Button (40dp visual, 44dp touch target) */}
        <div className={styles.buttonSlot}>
          <button
            ref={moreBtnRef}
            type="button"
            className={styles.circleBtn}
            onClick={() => setShowMoreMenu(prev => !prev)}
            aria-label={t('More actions')}
            aria-expanded={showMoreMenu}
            aria-haspopup="menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              <circle cx="19" cy="12" r="1.5" fill="currentColor" />
              <circle cx="5" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      {/* ================= MORE ⋯ POPOVER MENU ================= */}
      {showMoreMenu && (
        <div
          ref={menuRef}
          className={styles.moreMenu}
          role="menu"
          aria-label={t('More actions')}
        >
          {previousLocation && (
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => {
                setShowMoreMenu(false);
                onJumpToPrevious?.();
              }}
            >
              <span className={styles.menuItemIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 14l-4-4 4-4" />
                  <path d="M5 10h11a4 4 0 1 1 0 8h-1" />
                </svg>
              </span>
              <span className={styles.menuItemText}>{t('Back to previous location')}</span>
            </button>
          )}

          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              setShowMoreMenu(false);
              onOpenSearch?.();
            }}
          >
            <span className={styles.menuItemIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <span className={styles.menuItemText}>{t('Search document')}</span>
          </button>

          <button
            type="button"
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              setShowMoreMenu(false);
              onOpenBookmarks?.();
            }}
          >
            <span className={styles.menuItemIcon} aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className={styles.menuItemText}>{t('Bookmarks')}</span>
            <span className={styles.menuItemBadge}>{bookmarksCount}</span>
          </button>
        </div>
      )}

      {/* ================= TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div
          className={styles.toast}
          role="status"
          aria-live="polite"
        >
          <span className={styles.toastText}>{toastMessage}</span>
          {toastUndoAction && (
            <button
              type="button"
              className={styles.toastUndoBtn}
              onClick={() => {
                toastUndoAction();
                setToastMessage(null);
                setToastUndoAction(null);
              }}
            >
              {t('Undo')}
            </button>
          )}
        </div>
      )}

      {/* ================= BOTTOM BAR ================= */}
      <footer className={styles.bottomBar}>
        {/* Row 1: Progress Scrubber */}
        <div className={styles.progressRow}>
          <div className={styles.sliderContainer}>
            {/* Scrubber preview bubble on drag */}
            {isScrubbing && locationsReady && (
              <div
                className={styles.scrubBubble}
                style={{ left: `${Math.min(92, Math.max(8, scrubValue))}%` }}
              >
                {chapterTitle ? `${chapterTitle} · ` : ''}{currentDisplayPct}%
              </div>
            )}

            <input
              type="range"
              className={styles.slider}
              min="0"
              max="100"
              step="1"
              value={isScrubbing ? scrubValue : percentage}
              disabled={!locationsReady}
              onPointerDown={handleSliderPointerDown}
              onInput={handleSliderInput}
              onChange={handleSliderInput}
              onPointerUp={handleSliderCommit}
              style={{
                '--progress-ratio': `${locationsReady ? (isScrubbing ? scrubValue : percentage) : 0}%`,
              }}
              aria-label={t('Reading progress')}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={currentDisplayPct}
              aria-valuetext={displayLabel}
            />
          </div>

          <span className={styles.progressValue}>
            {displayLabel}
          </span>
        </div>

        {/* Row 2: 4 Tools with equal width (+-1px) */}
        <nav className={styles.toolsRow} aria-label={t('Reader controls')}>
          {/* Tool 1: Dấu trang */}
          <button
            type="button"
            className={`${styles.toolBtn} ${isBookmarked ? styles.toolBtnActive : ''}`}
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? t('Remove bookmark') : t('Add bookmark')}
            title={isBookmarked ? t('Remove bookmark') : t('Add bookmark')}
          >
            <span className={styles.toolIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </span>
          </button>

          {/* Tool 2: Ghi chú */}
          <button
            type="button"
            className={styles.toolBtn}
            onClick={onOpenBookmarks}
            aria-label={t('Show bookmarks')}
            title={t('Bookmarks')}
          >
            <span className={styles.toolIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </span>
          </button>

          {/* Tool 3: Giao diện chữ */}
          <button
            type="button"
            className={styles.toolBtn}
            onClick={onOpenSettings}
            aria-label={format === 'epub' ? t('Reading settings') : t('Reader settings')}
            title={format === 'epub' ? t('Reading settings') : t('Reader settings')}
          >
            <span className={styles.toolIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 19 8 6 12 19" />
                <line x1="5.5" y1="14" x2="10.5" y2="14" />
                <path d="M15 13a3 3 0 1 0 4 2.8V13h-4z" />
                <path d="M19 13v6" />
              </svg>
            </span>
          </button>

          {/* Tool 4: Mục lục */}
          <button
            type="button"
            className={styles.toolBtn}
            onClick={onOpenTOC}
            aria-label={t('Table of contents')}
            title={t('Contents')}
          >
            <span className={styles.toolIcon} aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="15" y2="18" />
              </svg>
            </span>
          </button>
        </nav>
      </footer>
    </div>
  );
}
