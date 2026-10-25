// src/components/Library/BookQuickPreviewModal.jsx
import { useMemo, useState } from 'react';
import Sheet from '../Common/Sheet';
import Cover from '../Common/Cover';
import { useI18n } from '../../i18n/context';
import { cleanSynopsis } from '../../utils/cleanSynopsis';
import { readProgressPercent } from '../../utils/storageKeys';
import Button from '../Common/Button';
import styles from './BookQuickPreviewModal.module.css';

export default function BookQuickPreviewModal({
  book,
  isOpen,
  onClose,
  onOpenBook,
  onOpenBookInfo,
  onToggleFavorite,
  onAddToList,
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const synopsis = useMemo(() => {
    return cleanSynopsis(book?.description || '');
  }, [book?.description]);

  if (!isOpen || !book) return null;

  const progress = Math.round(readProgressPercent(book));
  const isLongSynopsis = synopsis.length > 200;

  const handleRead = () => {
    onClose();
    if (onOpenBook) onOpenBook(book);
  };

  const handleDetails = () => {
    onClose();
    if (onOpenBookInfo) onOpenBookInfo(book);
  };

  return (
    <Sheet
      title={t('Quick preview')}
      onClose={onClose}
      footer={
        <div className={styles.actionsRow}>
          <Button
            variant="accent"
            size="M"
            onPress={handleRead}
          >
            {progress > 0 ? t('Continue') : t('Read')}
          </Button>
          <Button
            variant="secondary"
            size="M"
            onPress={handleDetails}
          >
            {t('Book details')}
          </Button>
        </div>
      }
    >
      <div className={styles.quickPreviewContent}>
        {/* Header: Cover, Title, Author, Format, Progress */}
        <div className={styles.headerRow}>
          <div className={styles.coverContainer}>
            <Cover
              src={book.coverUrl || book.coverImage}
              title={book.title}
              author={book.author}
              alt={book.title}
            />
          </div>

          <div className={styles.headerMeta}>
            <h2 className={styles.title}>{book.title}</h2>
            <p className={styles.author}>{book.author || t('Unknown author')}</p>

            <div className={styles.badgesRow}>
              <span className={styles.formatBadge}>
                {String(book.format || 'epub').toUpperCase()}
              </span>
              {progress > 0 && (
                <span className={styles.progressBadge}>{progress}%</span>
              )}
            </div>

            {/* Quick action secondary buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {onToggleFavorite && (
                <Button
                  variant={book.isFavorite ? 'accent' : 'secondary'}
                  size="S"
                  onPress={() => onToggleFavorite(book)}
                >
                  {book.isFavorite ? `★ ${t('Favorites')}` : `☆ ${t('Favorite')}`}
                </Button>
              )}
              {onAddToList && (
                <Button
                  variant="secondary"
                  size="S"
                  onPress={() => {
                    onClose();
                    onAddToList(book);
                  }}
                >
                  {t('Add to list')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cleaned Synopsis Section */}
        <div className={styles.synopsisSection}>
          <span className={styles.synopsisLabel}>{t('Synopsis')}</span>
          {synopsis ? (
            <>
              <p className={`${styles.synopsisText} ${!expanded ? styles.clampedText : ''}`}>
                {synopsis}
              </p>
              {isLongSynopsis && (
                <div style={{ marginTop: '4px' }}>
                  <Button
                    variant="secondary"
                    size="S"
                    onPress={() => setExpanded(!expanded)}
                  >
                    {expanded ? t('Show less') : t('Show more')}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptySynopsis}>
              <p className={styles.emptyText}>{t('No synopsis available.')}</p>
              <Button
                variant="secondary"
                size="S"
                onPress={handleDetails}
              >
                {t('Update information')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
