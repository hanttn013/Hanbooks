// src/components/Home/HomeScreen.jsx
import { useState, useMemo } from 'react';
import Cover from '../Common/Cover';
import BookCard from '../Common/BookCard';
import ListCard from '../Common/ListCard';
import EmptyState from '../Common/EmptyState';
import PageHeader from '../Common/PageHeader';
import { useI18n } from '../../i18n/context';
import { readProgressPercent } from '../../utils/storageKeys';
import { SearchField } from '@react-spectrum/s2/SearchField';
import Button from '../Common/Button';
import IconButton from '../Common/IconButton';
import TextAction from '../Common/TextAction';
import EdgeAction from '../Common/EdgeAction';
import { ProgressBar } from '@react-spectrum/s2/ProgressBar';
import BookQuickPreviewModal from '../Library/BookQuickPreviewModal';
import styles from './HomeScreen.module.css';

export default function HomeScreen({
  library,
  onOpenBook,
  onOpenBookInfo,
  onOpenList,
  onGoLibrary,
  onGoLists,
}) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [quickPreviewBook, setQuickPreviewBook] = useState(null);
  const books = useMemo(() => library.allBooksRaw || [], [library.allBooksRaw]);
  const reading = books
    .filter(book => book.status === 'reading' || book.lastOpenedAt)
    .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
  const current = reading[0] || books[0];
  const recent = [...books]
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    .slice(0, 10);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return books.filter(b =>
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q))
    );
  }, [books, searchQuery]);

  const currentPct = current ? Math.round(readProgressPercent(current)) : 0;

  return (
    <div className={styles.homeScreen}>
      <PageHeader
        title={t('Home')}
        actions={
          <EdgeAction edge="right" offset={15}>
            <IconButton
              aria-label={t('Library')}
              onPress={onGoLibrary}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </IconButton>
          </EdgeAction>
        }
      />

      <div className={`${styles.scrollArea} screen-scroll`}>
        <div className={styles.container}>
          {/* S2 SearchField */}
          <div className={styles.searchSection}>
            <SearchField
              aria-label={t('Search book ....')}
              placeholder={t('Search book ....')}
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
          </div>

          {/* Search Results if query present */}
          {searchQuery.trim() ? (
            <section className={styles.shelfSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('Search results')}</h2>
                <TextAction
                  onPress={() => setSearchQuery('')}
                >
                  {t('Clear')}
                </TextAction>
              </div>
              {filteredBooks.length > 0 ? (
                <div className={styles.booksGrid}>
                  {filteredBooks.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onOpenBook={onOpenBook}
                      onOpenBookInfo={onOpenBookInfo}
                      onQuickPreview={(b) => setQuickPreviewBook(b)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t('No books found')}
                  description={t('Try another search, clear filters, or import a document.')}
                />
              )}
            </section>
          ) : (
            <>
              {/* 1. Compact Hero Feature: Continue Reading (Height <= ~120px, 72-80px cover) */}
              {current ? (
                <section aria-label={t('Continue Reading')} className={styles.heroSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t('Continue Reading')}</h2>
                    <EdgeAction edge="right" isText offset={1}>
                      <TextAction
                        size="S"
                        onPress={onGoLibrary}
                      >
                        {t('See More')}
                      </TextAction>
                    </EdgeAction>
                  </div>

                  <div
                    className={styles.heroCard}
                    onClick={() => onOpenBook(current)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpenBook(current)}
                    aria-label={`${t('Continue Reading')}: ${current.title}`}
                  >
                    <div
                      className={styles.heroCoverArea}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBookInfo(current);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          onOpenBookInfo(current);
                        }
                      }}
                      aria-label={`${t('View details')}: ${current.title}`}
                    >
                      <div className={styles.heroCover}>
                        <Cover
                          src={current.coverUrl || current.coverImage}
                          title={current.title}
                          author={current.author}
                          alt={current.title}
                        />
                      </div>
                    </div>

                    <div className={styles.heroInfo}>
                      <div className={styles.heroTextGroup}>
                        <h3 className={styles.heroTitle}>
                          {current.title}
                        </h3>
                        <p className={styles.heroAuthor}>
                          {current.author || t('Unknown author')}
                        </p>
                      </div>

                      {/* Single horizontal row: [ProgressBar flex-1 + "0%" right] [Button Tiếp tục] */}
                      <div className={styles.heroBottomRow}>
                        <div className={styles.heroProgressGroup}>
                          <ProgressBar
                            aria-label={t('Reading progress')}
                            value={currentPct}
                            size="S"
                          />
                          <span className={styles.heroProgressPct}>{currentPct}%</span>
                        </div>
                        <Button
                          variant="accent"
                          size="S"
                          onPress={() => {
                            onOpenBook(current);
                          }}
                        >
                          {t('Continue')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>
              ) : (
                <EmptyState
                  title={t('No books yet')}
                  description={t('Import a document to start reading.')}
                  actionLabel={t('Import documents')}
                  onAction={onGoLibrary}
                />
              )}

              {/* 2. Recommended for you (Uniform 108px cover size with scroll-snap) */}
              {books.length > 0 && (
                <section className={styles.shelfSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t('Recommended for you')}</h2>
                    <EdgeAction edge="right" isText offset={1}>
                      <TextAction
                        size="S"
                        onPress={onGoLibrary}
                      >
                        {t('See More')}
                      </TextAction>
                    </EdgeAction>
                  </div>
                  <div className={styles.shelfScrollWrapper}>
                    <div className={styles.shelfScrollRow}>
                      {books.slice(0, 10).map(book => (
                        <div key={book.id} className={styles.shelfItem}>
                          <BookCard
                            book={book}
                            onOpenBook={onOpenBook}
                            onOpenBookInfo={onOpenBookInfo}
                            onQuickPreview={(b) => setQuickPreviewBook(b)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* 3. Recently Added (Same uniform 108px cover size with scroll-snap) */}
              {recent.length > 0 && (
                <section className={styles.shelfSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t('Recently Added')}</h2>
                    <EdgeAction edge="right" isText offset={1}>
                      <TextAction
                        size="S"
                        onPress={onGoLibrary}
                      >
                        {t('See More')}
                      </TextAction>
                    </EdgeAction>
                  </div>
                  <div className={styles.shelfScrollWrapper}>
                    <div className={styles.shelfScrollRow}>
                      {recent.map(book => (
                        <div key={book.id} className={styles.shelfItem}>
                          <BookCard
                            book={book}
                            onOpenBook={onOpenBook}
                            onOpenBookInfo={onOpenBookInfo}
                            onQuickPreview={(b) => setQuickPreviewBook(b)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* 4. Lists Shelf */}
              {library.lists && library.lists.length > 0 && (
                <section className={styles.shelfSection}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>{t('Your Lists')}</h2>
                    <EdgeAction edge="right" isText>
                      <TextAction
                        size="S"
                        onPress={onGoLists}
                      >
                        {t('All lists')}
                      </TextAction>
                    </EdgeAction>
                  </div>
                  <div className={styles.listsGrid}>
                    {library.lists.slice(0, 4).map(list => (
                      <ListCard
                        key={list.id}
                        list={list}
                        onOpenList={onOpenList}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Preview Modal on Home Screen */}
      <BookQuickPreviewModal
        book={quickPreviewBook}
        isOpen={Boolean(quickPreviewBook)}
        onClose={() => setQuickPreviewBook(null)}
        onOpenBook={onOpenBook}
        onOpenBookInfo={onOpenBookInfo}
        onToggleFavorite={async (book) => {
          await library.updateBook(book.id, { isFavorite: !book.isFavorite });
          setQuickPreviewBook(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
        }}
        onAddToList={() => {
          onGoLibrary?.();
        }}
      />
    </div>
  );
}
