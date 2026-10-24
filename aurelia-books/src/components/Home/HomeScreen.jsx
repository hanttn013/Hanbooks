import BookCover from '../Library/BookCover';
import { Action } from '../UI/Controls';
import { useI18n } from '../../i18n/context';
import { readProgressPercent } from '../../utils/storageKeys';

function BookCard({ book, onOpenBook, onOpenBookInfo }) {
  const { t } = useI18n();
  return <article className="book-card">
    <button className="book-card-cover" onClick={() => onOpenBook(book)} aria-label={`${t('Read')}: ${book.title}`}><BookCover book={book} size="medium" /></button>
    <h3>{book.title}</h3><p>{book.author}</p>
    <p>{t('completePercent', { count: Math.round(readProgressPercent(book)) })}</p>
    <div className="book-card-actions"><Action onPress={() => onOpenBookInfo(book)}>{t('Info')}</Action></div>
  </article>;
}

export default function HomeScreen({ library, onOpenBook, onOpenBookInfo, onOpenList, onGoLibrary, onGoLists }) {
  const { t } = useI18n();
  const books = library.allBooksRaw || [];
  const reading = books.filter(book => book.status === 'reading' || book.lastOpenedAt).sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
  const current = reading[0] || books[0];
  const recent = [...books].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)).slice(0, 8);
  return <div className="screen-container">
    <header className="page-layout safe-top" style={{ paddingBottom: 0, gap: 12 }}><p className="aurelia-wordmark">ShanBooks</p><h1 className="screen-title">{t('Home')}</h1></header>
    <div className="screen-scroll"><main className="page-layout">
      {current ? <section aria-label={t('Continue Reading')} className="hero-reading">
        <BookCover book={current} size="hero" />
        <div style={{ minWidth: 0 }}><p className="aurelia-wordmark">{t('Now reading')}</p><h2>{current.title}</h2><p>{current.author}</p>
          <p>{t('completePercent', { count: Math.round(readProgressPercent(current)) })}</p>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${readProgressPercent(current)}%` }} /></div>
          <div className="action-row"><Action primary onPress={() => onOpenBook(current)}>{t('Read now')}</Action><Action onPress={() => onOpenBookInfo(current)}>{t('Info')}</Action></div>
        </div>
      </section> : <section className="empty-state"><h2>{t('No books yet')}</h2><p>{t('Import a document to start reading.')}</p><Action primary onPress={onGoLibrary}>{t('Import documents')}</Action></section>}
      {reading.length > 1 && <section><div className="section-heading"><h2>{t('Reading Queue')}</h2><Action onPress={onGoLibrary}>{t('See all')}</Action></div><div className="book-cards">{reading.filter(book => book.id !== current?.id).slice(0, 4).map(book => <BookCard key={book.id} book={book} onOpenBook={onOpenBook} onOpenBookInfo={onOpenBookInfo} />)}</div></section>}
      <section><div className="section-heading"><h2>{t('Recently Added')}</h2><Action onPress={onGoLibrary}>{t('See library')}</Action></div><div className="book-cards">{recent.map(book => <BookCard key={book.id} book={book} onOpenBook={onOpenBook} onOpenBookInfo={onOpenBookInfo} />)}</div></section>
      <section><div className="section-heading"><h2>{t('Your Lists')}</h2><Action onPress={onGoLists}>{t('All lists')}</Action></div><div className="field-grid">{(library.lists || []).slice(0, 4).map(list => <article key={list.id} className="book-card"><h3>{list.name}</h3><p>{t('booksCount', { count: list.bookIds.length })}</p><Action onPress={() => onOpenList(list.id)}>{t('Read')}</Action></article>)}</div></section>
    </main></div>
  </div>;
}
