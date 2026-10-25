// src/components/Common/BookCard.jsx
import Cover from './Cover';
import styles from './BookCard.module.css';
import { useI18n } from '../../i18n/context';
import { ActionMenu, MenuItem } from '@react-spectrum/s2/ActionMenu';
import { useLongPress } from '../../hooks/useLongPress';

export default function BookCard({
  book,
  onOpenBook,
  onOpenBookInfo,
  onQuickPreview,
  onTap,
  onInfo,
  onOpenInfo,
  onClick,
  layout = 'grid',
  className = '',
  selecting = false,
  selected = false,
  onToggleSelect,
}) {
  const { t } = useI18n();
  if (!book) return null;

  const handleOpen = onOpenBook || onTap || onClick;
  const handleInfo = onOpenBookInfo || onOpenInfo || onInfo;

  const progress = Number(book.progressPercent || book.progress || 0);

  const handleClick = (e) => {
    if (selecting) {
      if (onToggleSelect) onToggleSelect(book.id);
      return;
    }
    // Ignore clicks originating from the action button
    if (e.target.closest('[data-book-action]')) return;
    if (handleOpen) handleOpen(book);
  };

  const handleLongPress = () => {
    if (selecting) {
      if (onToggleSelect) onToggleSelect(book.id);
      return;
    }
    if (onQuickPreview) {
      onQuickPreview(book);
    } else if (handleInfo) {
      handleInfo(book);
    }
  };

  const longPressProps = useLongPress({
    onLongPress: handleLongPress,
    onClick: handleClick,
    threshold: 500,
    moveTolerance: 8,
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (selecting) {
        if (onToggleSelect) onToggleSelect(book.id);
      } else {
        if (handleOpen) handleOpen(book);
      }
    }
  };

  const metadataStatusAttr = book.metadataStatus === 'processing'
    ? 'running'
    : (book.metadataStatus === 'ready' ? 'done' : book.metadataStatus);

  return (
    <article
      className={`${styles.bookCard} ${className} ${selected ? styles.selectedCard : ''}`}
      {...longPressProps}
      data-layout={layout}
      data-book-id={book.id}
      data-book-format={book.format}
      data-metadata-status={metadataStatusAttr}
      data-selected={selected || undefined}
      {...(selecting ? {
        role: 'checkbox',
        tabIndex: 0,
        'aria-checked': selected,
        onKeyDown: handleKeyDown,
        'aria-label': `${book.title} - ${book.author || t('Unknown author')}`
      } : {})}
    >
      <div
        className={styles.coverWrapper}
        {...(!selecting ? {
          role: 'button',
          tabIndex: 0,
          onKeyDown: handleKeyDown,
          'aria-label': `${book.title} - ${book.author || t('Unknown author')}`
        } : {})}
      >
        <Cover
          src={book.coverUrl || book.coverImage}
          title={book.title}
          author={book.author}
          alt={book.title}
        />
        {selecting && (
          <div className={`${styles.selectBadge} ${selected ? styles.selectedBadge : ''}`} aria-hidden="true">
            {selected && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        )}
        {progress > 0 && (
          <div className={styles.slimProgressBar} aria-hidden="true">
            <div className={styles.slimProgressFill} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        )}
      </div>

      <div className={styles.cardMeta}>
        <h3 className={styles.bookTitle} title={book.title}>
          {book.title}
        </h3>
        <p className={styles.bookAuthor} title={book.author || t('Unknown author')}>
          {book.author || t('Unknown author')}
        </p>

        <div className={styles.cardMetaRow}>
          <div className={styles.metaBadges}>
            <span className={styles.formatBadge}>
              {String(book.format || 'epub').toUpperCase()}
            </span>
            {progress > 0 && (
              <span className={styles.progressText}>{Math.round(progress)}%</span>
            )}
          </div>
          {!selecting && (
            <div
              data-book-action="true"
              className={styles.actionWrapper}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <ActionMenu
                isQuiet
                size="S"
                aria-label={`${t('Book options')}: ${book.title}`}
                onAction={(key) => {
                  if (key === 'preview') {
                    if (onQuickPreview) onQuickPreview(book);
                    else if (handleInfo) handleInfo(book);
                  } else if (key === 'info') {
                    if (handleInfo) handleInfo(book);
                  }
                }}
              >
                <MenuItem id="preview">{t('Quick preview')}</MenuItem>
                <MenuItem id="info">{t('Book details')}</MenuItem>
              </ActionMenu>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
