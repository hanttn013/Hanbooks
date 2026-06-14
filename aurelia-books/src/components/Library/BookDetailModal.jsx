import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookCover from './BookCover';
import { StorageManager } from '../../utils/StorageManager';
import { extractEpubMetadata } from '../../utils/epubMetadata';

function progressFor(book) {
  return parseFloat(localStorage.getItem(`aurelia_pct_${book.id}`) || (book.status === 'finished' ? 100 : 0));
}

function formatFileSize(size) {
  if (!size) return 'Unknown size';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function needsMetadataRefresh(book) {
  const chapterTokens = (book.description?.match(/\b(?:chương|chÆ°Æ¡ng|chapter)\s*\d+/gi) || []).length;
  return Boolean(book.fileBlob) && (
    chapterTokens > 8
    || !book.description
    || !book.author
    || book.author === 'Unknown Author'
    || !book.chapterCount
  );
}

export default function BookDetailModal({ book, onClose, onOpen, library }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [listId, setListId] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshingMeta, setIsRefreshingMeta] = useState(false);
  const updateBook = library?.updateBook;
  const shouldRefreshMetadata = needsMetadataRefresh(book);
  const pct = progressFor(book);
  const infoBookmark = bookmarks.find(item => item.cfi === '' && item.chapterTitle === 'Book info');

  useEffect(() => {
    StorageManager.getBookmarks(book.id).then(setBookmarks).catch(() => setBookmarks([]));
  }, [book.id]);

  useEffect(() => {
    let cancelled = false;
    if (!shouldRefreshMetadata) return undefined;

    window.setTimeout(() => {
      if (cancelled) return;
      setIsRefreshingMeta(true);
      extractEpubMetadata(book.fileBlob, {
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        characters: book.characters,
        originalTitle: book.originalTitle,
        editor: book.editor,
        beta: book.beta,
        chapterCount: book.chapterCount,
        estimatedPages: book.estimatedPages,
        fileSize: book.fileSize,
      })
        .then(metadata => {
          if (cancelled) return;
          updateBook?.(book.id, metadata);
        })
        .catch(err => console.warn('Could not refresh EPUB metadata:', err))
        .finally(() => {
          if (!cancelled) setIsRefreshingMeta(false);
        });
    }, 0);

    return () => {
      cancelled = true;
    };
  }, [
    shouldRefreshMetadata,
    book.id,
    book.fileBlob,
    book.title,
    book.author,
    book.genre,
    book.description,
    book.characters,
    book.originalTitle,
    book.editor,
    book.beta,
    book.chapterCount,
    book.estimatedPages,
    book.fileSize,
    updateBook,
  ]);

  const handleQuickBookmark = async () => {
    if (infoBookmark) return;
    const bookmark = {
      id: uuidv4(),
      bookId: book.id,
      cfi: '',
      chapterTitle: 'Book info',
      excerpt: book.description || `${book.title} by ${book.author}`,
      createdAt: Date.now(),
    };
    await StorageManager.addBookmark(bookmark);
    setBookmarks(prev => [...prev, bookmark]);
    library?.refreshLibrary?.();
  };

  const handleRename = async () => {
    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    if (!cleanTitle || !cleanAuthor) return;
    await library?.updateBook?.(book.id, { title: cleanTitle, author: cleanAuthor });
    setRenaming(false);
  };

  const handleFavorite = async () => {
    const next = !book.isFavorite;
    await library?.updateBook?.(book.id, { isFavorite: next });
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${book.title}" from your library?`)) return;
    setIsDeleting(true);
    try {
      await library?.deleteBook?.(book.id);
      onClose();
    } catch (err) {
      alert(err.message || 'Could not delete this book.');
      setIsDeleting(false);
    }
  };

  const handleAddToList = async () => {
    if (!listId) return;
    await library?.addBooksToList?.(listId, [book.id]);
    setListId('');
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        style={{ maxHeight: '88%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Book Info</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-scroll">
          <div style={{ display: 'flex', gap: 16, padding: '10px 20px 18px' }}>
            <BookCover book={book} size="hero" />
            <div style={{ flex: 1, minWidth: 0 }}>
              {renaming ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
                  <input value={author} onChange={e => setAuthor(e.target.value)} style={inputStyle} />
                  <button className="btn-primary" style={{ padding: 10, fontSize: 13 }} onClick={handleRename}>Save</button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: 24, lineHeight: 1.05, color: 'var(--text-primary)' }}>
                    {book.title}
                  </h2>
                  <p style={{ marginTop: 5, color: 'var(--text-secondary)', fontSize: 14 }}>{book.author}</p>
                </>
              )}
              <p style={{ marginTop: 12, color: 'var(--accent)', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {book.genre || 'Fiction'} · {book.estimatedPages || 0} pages
              </p>
              <p style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
                {Math.round(pct)}% · {book.status || 'unread'}
              </p>
              <div style={{ marginTop: 10 }} className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn-primary" style={{ padding: 12, fontSize: 14 }} onClick={() => { onOpen(book); onClose(); }}>
              {pct > 0 ? 'Continue' : 'Read'}
            </button>
            <button className="btn-primary" style={secondaryBtn} onClick={handleFavorite}>
              {book.isFavorite ? 'Unfavorite' : 'Favorite'}
            </button>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <p style={sectionLabel}>Synopsis</p>
            {isRefreshingMeta && (
              <p style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                Refreshing EPUB intro...
              </p>
            )}
            <p style={{ marginTop: 8, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-line' }}>
              {book.description || 'No synopsis was found in the EPUB. Aurelia will show an extracted preview here after metadata is available.'}
            </p>
          </div>

          {(book.originalTitle || book.characters || book.editor || book.beta) && (
            <div style={{ padding: '0 20px 16px' }}>
              <p style={sectionLabel}>Review Info</p>
              <div style={metaGrid}>
                {book.originalTitle && <Meta label="Original" value={book.originalTitle} />}
                {book.characters && <Meta label="Characters" value={book.characters} />}
                {book.editor && <Meta label="Editor" value={book.editor} />}
                {book.beta && <Meta label="Beta" value={book.beta} />}
              </div>
            </div>
          )}

          <div style={{ padding: '0 20px 16px' }}>
            <p style={sectionLabel}>Metadata</p>
            <div style={metaGrid}>
              <Meta label="Publisher" value={book.publisher || 'Unknown'} />
              <Meta label="Language" value={book.language || 'Unknown'} />
              <Meta label="Published" value={book.publishedAt || 'Unknown'} />
              <Meta label="Chapters" value={book.chapterCount || 'Unknown'} />
              <Meta label="File" value={formatFileSize(book.fileSize)} />
              <Meta label="Bookmarks" value={bookmarks.length} />
            </div>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <p style={sectionLabel}>Lists</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <select value={listId} onChange={e => setListId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="">Choose list</option>
                {(library?.lists || []).map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
              </select>
              <button className="btn-primary" style={{ width: 72, padding: 0, fontSize: 13 }} onClick={handleAddToList} disabled={!listId}>
                Add
              </button>
            </div>
          </div>

          <div style={{ padding: '0 20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button style={plainBtn} onClick={handleQuickBookmark} disabled={Boolean(infoBookmark)}>
              {infoBookmark ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button style={plainBtn} onClick={() => setRenaming(prev => !prev)}>Rename</button>
            <button style={{ ...plainBtn, color: '#D33' }} onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          <div style={{ padding: '0 20px 34px' }}>
            <button className="btn-primary" style={{ padding: 12, fontSize: 14, background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: 'none' }} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <small style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</small>
      <strong style={{ display: 'block', marginTop: 3, color: 'var(--text-primary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</strong>
    </div>
  );
}

const sectionLabel = {
  color: 'var(--text-secondary)',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  height: 40,
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  padding: '0 10px',
  font: 'inherit',
};

const secondaryBtn = {
  padding: 12,
  fontSize: 14,
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  boxShadow: 'none',
};

const plainBtn = {
  minHeight: 40,
  border: '1px solid var(--border)',
  borderRadius: 12,
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  fontWeight: 700,
  cursor: 'pointer',
};

const metaGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  marginTop: 9,
};
