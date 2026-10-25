import { useState } from 'react';
import ReaderSheet from './ReaderSheet';
import { useI18n } from '../../i18n/context';
import styles from './BookmarksModal.module.css';

function formatRelativeTime(timestamp, locale = 'vi-VN') {
  if (!timestamp) return '';
  const now = Date.now();
  const diffSec = Math.round((timestamp - now) / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(diffSec) < 60) return locale.startsWith('vi') ? 'Vừa xong' : 'Just now';
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  return rtf.format(diffDay, 'day');
}

export default function BookmarksModal({
  bookmarks = [],
  onJumpTo,
  onRemove,
  onClose,
}) {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' | 'notes'

  const bookmarkItems = bookmarks.filter(b => b.type !== 'highlight' && !b.note);
  const noteItems = bookmarks.filter(b => b.type === 'highlight' || Boolean(b.note));

  const itemsToDisplay = activeTab === 'bookmarks' ? bookmarkItems : noteItems;

  return (
    <ReaderSheet title={t('Saved bookmarks')} onClose={onClose}>
      <div className={styles.container}>
        {/* Tab switch between Bookmarks & Notes */}
        <div className={styles.tabRow} role="tablist" aria-label={t('Bookmarks and notes')}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'bookmarks'}
            className={`${styles.tabBtn} ${activeTab === 'bookmarks' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            {t('Bookmarks')} ({bookmarkItems.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'notes'}
            className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            {t('Notes')} ({noteItems.length})
          </button>
        </div>

        {itemsToDisplay.length > 0 ? (
          <div className={styles.list}>
            {itemsToDisplay.map((item) => {
              const pctLabel = item.percentage != null ? `${Math.round(item.percentage)}%` : '';
              const timeLabel = formatRelativeTime(item.createdAt, locale);
              const metaText = [pctLabel, timeLabel].filter(Boolean).join(' · ');

              return (
                <div
                  key={item.id}
                  className={styles.rowCard}
                  onClick={() => {
                    onJumpTo(item.cfi || item.locator);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onJumpTo(item.cfi || item.locator);
                      onClose();
                    }
                  }}
                >
                  <div className={styles.rowContent}>
                    <h3 className={styles.rowChapter}>
                      {item.chapterTitle || t('Bookmark')}
                    </h3>

                    {item.excerpt && (
                      <p className={styles.rowExcerpt}>"{item.excerpt}"</p>
                    )}

                    {item.note && (
                      <p className={styles.rowNote}>{item.note}</p>
                    )}

                    {metaText && (
                      <span className={styles.rowMeta}>{metaText}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    aria-label={`${t('Delete')}: ${item.chapterTitle || t('Bookmark')}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h4 className={styles.emptyTitle}>
              {activeTab === 'bookmarks' ? t('No bookmarks yet') : t('No notes yet')}
            </h4>
            <p className={styles.emptyText}>
              {activeTab === 'bookmarks'
                ? t('Tap the bookmark icon to save this page')
                : t('Select text while reading to create notes and highlights')}
            </p>
          </div>
        )}
      </div>
    </ReaderSheet>
  );
}
