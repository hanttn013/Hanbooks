import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import BookCover from './BookCover';
import { StorageManager } from '../../utils/StorageManager';
import { extractEpubMetadata, looksLikeTocText } from '../../utils/epubMetadata';

function progressFor(book) {
  return parseFloat(localStorage.getItem(`aurelia_pct_${book.id}`) || (book.status === 'finished' ? 100 : 0));
}

function formatFileSize(size) {
  if (!size) return 'Unknown size';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function needsMetadataRefresh(book) {
  return Boolean(book.fileBlob) && (
    book.metadataStatus === 'pending'
    || !book.metadataExtractedAt
    || looksLikeTocText(book.description)
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
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [displayBook, setDisplayBook] = useState(book);
  const mountedRef = useRef(true);
  const shouldRefreshMetadata = needsMetadataRefresh(book);
  const pct = progressFor(displayBook);
  const infoBookmark = bookmarks.find(item => item.cfi === '' && item.chapterTitle === 'Book info');
  const isBusy = isDeleting || isRefreshingMeta || isBookmarking || isAddingToList || isRenaming || isFavoriting;

  useEffect(() => {
    let active = true;
    StorageManager.getBookmarks(book.id)
      .then(items => {
        if (active && mountedRef.current) setBookmarks(items);
      })
      .catch(() => {
        if (active && mountedRef.current) setBookmarks([]);
      });
    return () => {
      active = false;
    };
  }, [book.id]);

  useEffect(() => {
    let active = true;
    StorageManager.getBookmarks(book.id)
      .then(items => {
        if (active && mountedRef.current) setBookmarks(items);
      })
      .catch(() => {
        if (active && mountedRef.current) setBookmarks([]);
      });
    return () => {
      active = false;
    };
  }, [book.id]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Auto trigger lazy repair
    if (book.metadataStatus === 'pending' || book.metadataStatus === 'processing') {
      setIsRefreshingMeta(true);
      library?.repairMetadata?.(book.id).finally(() => {
        if (mountedRef.current) setIsRefreshingMeta(false);
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [book.id, book.metadataStatus, library]);

  const handleRefreshMetadata = async () => {
    if (!book.fileBlob || isRefreshingMeta) return;
    setIsRefreshingMeta(true);
    try {
      await new Promise(resolve => window.setTimeout(resolve, 50));
      const metadata = await extractEpubMetadata(book.fileBlob, {
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
      });
      const updated = { ...book, ...metadata };
      if (!mountedRef.current) return;
      setDisplayBook(updated);
      await library?.updateBook?.(book.id, metadata);
    } catch (err) {
      console.warn('Could not refresh EPUB metadata:', err);
      if (mountedRef.current) alert('Could not repair this EPUB metadata.');
    } finally {
      if (mountedRef.current) setIsRefreshingMeta(false);
    }
  };

  const handleQuickBookmark = async () => {
    if (infoBookmark || isBookmarking || isBusy) return;
    setIsBookmarking(true);
    const bookmark = {
      id: uuidv4(),
      bookId: book.id,
      cfi: '',
      chapterTitle: 'Book info',
      excerpt: book.description || `${book.title} by ${book.author}`,
      createdAt: Date.now(),
    };
    try {
      await StorageManager.addBookmark(bookmark);
      if (!mountedRef.current) return;
      setBookmarks(prev => [...prev, bookmark]);
      library?.refreshLibrary?.();
    } finally {
      if (mountedRef.current) setIsBookmarking(false);
    }
  };

  const handleRename = async () => {
    const cleanTitle = title.trim();
    const cleanAuthor = author.trim();
    if (!cleanTitle || !cleanAuthor || isRenaming || isBusy) return;
    setIsRenaming(true);
    try {
      await library?.updateBook?.(book.id, { title: cleanTitle, author: cleanAuthor });
      if (!mountedRef.current) return;
      setDisplayBook(prev => ({ ...prev, title: cleanTitle, author: cleanAuthor }));
      setRenaming(false);
    } finally {
      if (mountedRef.current) setIsRenaming(false);
    }
  };

  const handleFavorite = async () => {
    if (isFavoriting || isBusy) return;
    setIsFavoriting(true);
    const next = !displayBook.isFavorite;
    try {
      await library?.updateBook?.(book.id, { isFavorite: next });
      if (!mountedRef.current) return;
      setDisplayBook(prev => ({ ...prev, isFavorite: next }));
    } finally {
      if (mountedRef.current) setIsFavoriting(false);
    }
  };

  const handleDelete = async () => {
    if (isBusy || !confirm(`Delete "${book.title}" from your library?`)) return;
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
    if (!listId || isAddingToList || isBusy) return;
    setIsAddingToList(true);
    try {
      await library?.addBooksToList?.(listId, [book.id]);
      if (!mountedRef.current) return;
      setListId('');
    } finally {
      if (mountedRef.current) setIsAddingToList(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => { if (!isBusy) onClose(); }}
    >
      <div
        className="modal-sheet"
        style={{ maxHeight: '88%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Book Info</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close" disabled={isBusy}>
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
                  <button className="btn-primary" style={{ padding: 10, fontSize: 13 }} onClick={handleRename} disabled={isBusy}>
                    {isRenaming ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: 24, lineHeight: 1.05, color: 'var(--text-primary)' }}>
                    {isRefreshingMeta ? <span style={{display:'inline-block', width:120, height:24, background:'var(--bg-secondary)', borderRadius:4, animation:'pulse 1.5s infinite'}} /> : displayBook.title}
                  </h2>
                  <p style={{ marginTop: 5, color: 'var(--text-secondary)', fontSize: 14 }}>
                    {isRefreshingMeta ? <span style={{display:'inline-block', width:80, height:14, background:'var(--bg-secondary)', borderRadius:4, animation:'pulse 1.5s infinite'}} /> : displayBook.author}
                  </p>
                </>
              )}
              <p style={{ marginTop: 12, color: 'var(--accent)', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {isRefreshingMeta ? 'LOADING...' : `${displayBook.genre || 'Fiction'} · ${displayBook.estimatedPages || 0} pages`}
              </p>
              <p style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
                {Math.round(pct)}% · {displayBook.status || 'unread'}
              </p>
              <div style={{ marginTop: 10 }} className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button className="btn-primary" style={{ padding: 12, fontSize: 14 }} onClick={() => { if (!isBusy) { onOpen(book); onClose(); } }} disabled={isBusy}>
              {pct > 0 ? 'Continue' : 'Read'}
            </button>
            <button className="btn-primary" style={secondaryBtn} onClick={handleFavorite} disabled={isBusy}>
              {isFavoriting ? 'Saving...' : displayBook.isFavorite ? 'Unfavorite' : 'Favorite'}
            </button>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <p style={sectionLabel}>Synopsis</p>
            {isRefreshingMeta && (
              <p style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 12 }}>
                Repairing EPUB info...
              </p>
            )}
            <p style={{ marginTop: 8, color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-line' }}>
              {isRefreshingMeta ? (
                <span style={{display:'block', width:'100%', height:60, background:'var(--bg-secondary)', borderRadius:4, animation:'pulse 1.5s infinite'}} />
              ) : (!looksLikeTocText(displayBook.description) && displayBook.description)
                ? displayBook.description
                : 'No clean synopsis was found. Use Repair Info to extract the intro/summary from this EPUB.'}
            </p>
            {shouldRefreshMetadata && (
              <button
                style={{ ...plainBtn, marginTop: 12, width: '100%' }}
                onClick={handleRefreshMetadata}
                disabled={isBusy}
              >
                {isRefreshingMeta ? 'Repairing...' : 'Repair Info'}
              </button>
            )}
          </div>

          {(displayBook.originalTitle || displayBook.characters || displayBook.editor || displayBook.beta) && (
            <div style={{ padding: '0 20px 16px' }}>
              <p style={sectionLabel}>Review Info</p>
              <div style={metaGrid}>
                {displayBook.originalTitle && <Meta label="Original" value={displayBook.originalTitle} />}
                {displayBook.characters && <Meta label="Characters" value={displayBook.characters} />}
                {displayBook.editor && <Meta label="Editor" value={displayBook.editor} />}
                {displayBook.beta && <Meta label="Beta" value={displayBook.beta} />}
              </div>
            </div>
          )}

          <div style={{ padding: '0 20px 16px' }}>
            <p style={sectionLabel}>Metadata</p>
            <div style={metaGrid}>
              <Meta label="Publisher" value={displayBook.publisher || 'Unknown'} />
              <Meta label="Language" value={displayBook.language || 'Unknown'} />
              <Meta label="Published" value={displayBook.publishedAt || 'Unknown'} />
              <Meta label="Chapters" value={displayBook.chapterCount || 'Unknown'} />
              <Meta label="File" value={formatFileSize(displayBook.fileSize)} />
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
              <button className="btn-primary" style={{ width: 72, padding: 0, fontSize: 13 }} onClick={handleAddToList} disabled={!listId || isBusy}>
                {isAddingToList ? '...' : 'Add'}
              </button>
            </div>
          </div>

          <div style={{ padding: '0 20px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <button style={plainBtn} onClick={handleQuickBookmark} disabled={Boolean(infoBookmark) || isBusy}>
              {isBookmarking ? 'Saving...' : infoBookmark ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button style={plainBtn} onClick={() => setRenaming(prev => !prev)} disabled={isBusy}>Rename</button>
            <button style={{ ...plainBtn, color: '#D33' }} onClick={handleDelete} disabled={isBusy}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          <div style={{ padding: '0 20px 34px' }}>
            <button className="btn-primary" style={{ padding: 12, fontSize: 14, background: 'var(--bg-secondary)', color: 'var(--text-primary)', boxShadow: 'none' }} onClick={onClose} disabled={isBusy}>
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
