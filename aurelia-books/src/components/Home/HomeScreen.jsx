import BookCover from '../Library/BookCover';
import styles from './HomeScreen.module.css';

function progressFor(book) {
  return parseFloat(localStorage.getItem(`aurelia_pct_${book.id}`) || (book.status === 'finished' ? 100 : 0));
}

export default function HomeScreen({ library, onOpenBook, onOpenBookInfo, onOpenList, onGoLibrary, onGoLists }) {
  const books = library.allBooksRaw || [];
  const reading = books
    .filter(book => book.status === 'reading' || book.lastOpenedAt)
    .sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
  const current = reading[0] || books[0];
  const queue = reading.filter(book => book.id !== current?.id).slice(0, 6);
  const recent = [...books].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).slice(0, 6);
  const lists = (library.lists || []).slice(0, 4);
  const openHeroOnKey = (event, book) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenBook(book);
    }
  };

  return (
    <div className={styles.screen}>
      <header className={`${styles.header} safe-top`}>
        <div className="brand-lockup">
          <img className="brand-logo" src="/branding/shanbooks-logo.png" alt="" />
          <p className="aurelia-wordmark">ShanBooks</p>
        </div>
        <h1 className="screen-title">Home</h1>
      </header>

      <div className="screen-scroll">
        <main className={styles.content}>
          {current && (
            <section>
              <div className={styles.sectionHeading}>
                <h2>Continue Reading</h2>
              </div>
              <div
                className={styles.heroCard}
                role="button"
                tabIndex={0}
                onClick={() => onOpenBook(current)}
                onKeyDown={event => openHeroOnKey(event, current)}
              >
                <BookCover book={current} size="hero" />
                <span className={styles.heroInfo}>
                  <span className={styles.eyebrow}>Now reading</span>
                  <span className={styles.heroTitle}>{current.title}</span>
                  <span className={styles.heroAuthor}>{current.author}</span>
                  <span className={styles.progressMeta}>
                    <span>{Math.round(progressFor(current))}% complete</span>
                    <span>{current.estimatedPages ? `${current.estimatedPages} pages` : 'EPUB'}</span>
                  </span>
                  <span className="progress-track">
                    <span className="progress-fill" style={{ width: `${progressFor(current)}%` }} />
                  </span>
                  <span className={styles.heroActions}>
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        onOpenBook(current);
                      }}
                    >
                      Read now
                    </button>
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        onOpenBookInfo(current);
                      }}
                    >
                      Info
                    </button>
                  </span>
                </span>
              </div>
            </section>
          )}

          {queue.length > 0 && (
            <section>
              <div className={styles.sectionHeading}>
                <h2>Reading Queue</h2>
                <button onClick={onGoLibrary}>See all</button>
              </div>
              <div className={styles.bookRail}>
                {queue.map(book => (
                  <button
                    key={book.id}
                    className={styles.railBook}
                    onClick={() => onOpenBook(book)}
                    onContextMenu={e => { e.preventDefault(); onOpenBookInfo(book); }}
                  >
                    <BookCover book={book} size="medium" style={{ width: 106, height: 159 }} />
                    <span>{book.title}</span>
                    <small>{Math.round(progressFor(book))}% complete</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className={styles.sectionHeading}>
              <h2>Recently Added</h2>
              <button onClick={onGoLibrary}>See library</button>
            </div>
            <div className={styles.bookRail}>
              {recent.map(book => (
                <button
                  key={book.id}
                  className={styles.railBook}
                  onClick={() => onOpenBook(book)}
                  onContextMenu={e => { e.preventDefault(); onOpenBookInfo(book); }}
                >
                  <BookCover book={book} size="medium" style={{ width: 106, height: 159 }} />
                  <span>{book.title}</span>
                  <small>{book.author}</small>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className={styles.sectionHeading}>
              <h2>Your Lists</h2>
              <button onClick={onGoLists}>All lists</button>
            </div>
            <div className={styles.listStack}>
              {lists.map(list => (
                <button key={list.id} className={styles.listRow} onClick={() => onOpenList(list.id)}>
                  <span className={`${styles.listThumb} ${styles[list.coverStyle] || styles.gold}`} />
                  <span className={styles.listText}>
                    <strong>{list.name}</strong>
                    <small>{list.bookIds.length} {list.bookIds.length === 1 ? 'book' : 'books'}</small>
                  </span>
                  <span className={styles.chevron}>›</span>
                </button>
              ))}
              {lists.length === 0 && (
                <button className={styles.emptyList} onClick={onGoLists}>Create your first list</button>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
