// src/components/Continue/ContinueScreen.jsx
import { motion } from 'framer-motion';
import BookCover from '../Library/BookCover';
import styles from './ContinueScreen.module.css';

export default function ContinueScreen({ library, onOpenBook }) {
  const { currentlyReading } = library;
  const mainBook = currentlyReading[0] || null;
  const alsoReading = currentlyReading.slice(1);

  const getPct = (bookId, status) =>
    parseFloat(localStorage.getItem(`aurelia_pct_${bookId}`) || (status === 'finished' ? 100 : 0));

  const getChapter = (bookId) => {
    try {
      const prog = JSON.parse(localStorage.getItem('aurelia_progress') || '{}');
      return prog[bookId]?.chapterTitle || null;
    } catch { return null; }
  };

  return (
    <div className={styles.screen}>
      <div className={`${styles.header} safe-top`}>
        <p className="aurelia-wordmark">AURELIA</p>
        <h1 className="screen-title">Continue</h1>
      </div>

      <div className="screen-scroll" style={{ padding: '0 16px 24px' }}>
        {!mainBook ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📖</div>
            <p style={{ color: 'var(--text-primary)', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
              No book in progress
            </p>
            <p className="text-secondary text-sm">
              Open a book from your Library to start reading
            </p>
          </div>
        ) : (
          <>
            {/* Main book hero card */}
            <motion.div
              className={`card ${styles.heroCard}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.heroTop}>
                <BookCover book={mainBook} size="hero" />
                <div className={styles.heroInfo}>
                  <p className={styles.heroLabel}>CURRENTLY READING</p>
                  <p className={styles.heroTitle}>{mainBook.title}</p>
                  <p className={`text-secondary`} style={{ fontSize: 14, marginTop: 4 }}>{mainBook.author}</p>
                  {getChapter(mainBook.id) && (
                    <div className={styles.chapterRow}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span className="text-secondary text-sm">{getChapter(mainBook.id)}</span>
                    </div>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <div className="progress-track" style={{ marginBottom: 4 }}>
                      <div className="progress-fill" style={{ width: `${getPct(mainBook.id, mainBook.status)}%` }} />
                    </div>
                    <p className="text-secondary text-xs">
                      {Math.round(getPct(mainBook.id, mainBook.status))}% complete
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                className={`btn-primary ${styles.continueBtn}`}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenBook(mainBook)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16v16H4z" fill="none"/>
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Continue Reading
              </motion.button>
            </motion.div>

            {/* Also reading */}
            {alsoReading.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <h2 className="section-title" style={{ marginBottom: 12 }}>Also Reading</h2>
                <div className="card">
                  {alsoReading.map((book, i) => (
                    <div key={book.id}>
                      <div
                        className={styles.alsoBook}
                        onClick={() => onOpenBook(book)}
                      >
                        <BookCover book={book} size="small" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>
                            {book.title}
                          </p>
                          <p className="text-secondary text-sm" style={{ marginTop: 2 }}>{book.author}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <div className="progress-track" style={{ flex: 1 }}>
                              <div className="progress-fill" style={{ width: `${getPct(book.id, book.status)}%` }} />
                            </div>
                            <span className="text-xs text-secondary">
                              {Math.round(getPct(book.id, book.status))}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {i < alsoReading.length - 1 && <div className="divider" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
