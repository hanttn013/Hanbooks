import { useMemo, useState } from 'react';
import BookCover from '../Library/BookCover';
import styles from './ListsScreen.module.css';

const COVER_STYLES = ['gold', 'cream', 'burgundy', 'forest', 'ink'];
const SORT_OPTIONS = [
  { value: 'lastOpenedAt', label: 'Recently Opened' },
  { value: 'addedAt', label: 'Recently Added' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'author', label: 'Author A-Z' },
  { value: 'progress', label: 'Progress' },
];

function progressFor(book) {
  return parseFloat(localStorage.getItem(`aurelia_pct_${book.id}`) || (book.status === 'finished' ? 100 : 0));
}

function sortBooks(books, mode) {
  return [...books].sort((a, b) => {
    if (mode === 'title') return a.title.localeCompare(b.title);
    if (mode === 'author') return a.author.localeCompare(b.author);
    if (mode === 'addedAt') return (b.addedAt || 0) - (a.addedAt || 0);
    if (mode === 'progress') return progressFor(b) - progressFor(a);
    return (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0);
  });
}

export default function ListsScreen({ library, activeListId, setActiveListId, onOpenBook, onOpenBookInfo }) {
  const [editingList, setEditingList] = useState(null);
  const [addingBook, setAddingBook] = useState(false);
  const activeList = (library.lists || []).find(list => list.id === activeListId) || null;

  const activeBooks = useMemo(() => {
    if (!activeList) return [];
    const raw = activeList.bookIds
      .map(id => (library.allBooksRaw || []).find(book => book.id === id))
      .filter(Boolean);
    return sortBooks(raw, activeList.sortBy || 'addedAt');
  }, [activeList, library.allBooksRaw]);

  return (
    <div className={styles.screen}>
      {!activeList ? (
        <>
          <header className={`${styles.header} safe-top`}>
            <div>
              <p className="aurelia-wordmark">AURELIA</p>
              <h1 className="screen-title">Lists</h1>
              <p className={styles.subhead}>Shelves for series, genres, moods, and plans.</p>
            </div>
            <button className={styles.createBtn} onClick={() => setEditingList({})}>+</button>
          </header>

          <div className="screen-scroll">
            <div className={styles.listStack}>
              {(library.lists || []).map(list => {
                const previews = list.bookIds
                  .slice(0, 3)
                  .map(id => (library.allBooksRaw || []).find(book => book.id === id))
                  .filter(Boolean);
                return (
                  <button key={list.id} className={styles.listCard} onClick={() => setActiveListId(list.id)}>
                    <span className={`${styles.coverStyle} ${styles[list.coverStyle] || styles.gold}`}>
                      <span className={styles.previewCovers}>
                        {previews.map(book => (
                          <img key={book.id} src={book.coverUrl || ''} alt="" />
                        ))}
                      </span>
                    </span>
                    <span className={styles.listInfo}>
                      <strong>{list.name}</strong>
                      <small>{list.description || 'Personal reading shelf'}</small>
                      <small>{list.bookIds.length} {list.bookIds.length === 1 ? 'book' : 'books'}</small>
                    </span>
                    <span className={styles.chevron}>›</span>
                  </button>
                );
              })}

              <button className={styles.emptyCreate} onClick={() => setEditingList({})}>Create new list</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <header className={`${styles.detailHeader} safe-top`}>
            <button className={styles.backBtn} onClick={() => setActiveListId(null)}>‹ Lists</button>
            <div className={styles.detailTitleRow}>
              <span className={`${styles.coverStyle} ${styles[activeList.coverStyle] || styles.gold}`} />
              <div>
                <h1>{activeList.name}</h1>
                <p>{activeList.description || `${activeList.bookIds.length} books`}</p>
              </div>
            </div>
            <div className={styles.detailTools}>
              <span>{activeBooks.length} {activeBooks.length === 1 ? 'book' : 'books'}</span>
              <select value={activeList.sortBy || 'addedAt'} onChange={e => library.updateList(activeList.id, { sortBy: e.target.value })}>
                {SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button onClick={() => setAddingBook(true)}>Add</button>
              <button onClick={() => setEditingList(activeList)}>Edit</button>
            </div>
          </header>

          <div className="screen-scroll">
            {activeBooks.length === 0 ? (
              <div className={styles.emptyState}>This list is empty. Add books from your library.</div>
            ) : (
              <ul className={styles.bookList}>
                {activeBooks.map(book => (
                  <li key={book.id}>
                    <button className={styles.bookRow} onClick={() => onOpenBook(book)}>
                      <BookCover book={book} size="small" />
                      <span>
                        <strong>{book.title}</strong>
                        <small>{book.author}</small>
                        <small>{book.genre || 'Fiction'} · {Math.round(progressFor(book))}%</small>
                      </span>
                    </button>
                    <div className={styles.rowActions}>
                      <button onClick={() => onOpenBookInfo(book)}>Info</button>
                      <button onClick={() => library.removeBookFromList(activeList.id, book.id)}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {editingList && (
        <ListEditor
          list={editingList.id ? editingList : null}
          onClose={() => setEditingList(null)}
          onDelete={async (id) => {
            if (!confirm('Delete this list? Books will stay in your library.')) return;
            await library.deleteList(id);
            setEditingList(null);
            setActiveListId(null);
          }}
          onSave={async (input) => {
            if (editingList.id) await library.updateList(editingList.id, input);
            else await library.createList(input);
            setEditingList(null);
          }}
        />
      )}

      {addingBook && activeList && (
        <AddBooksSheet
          books={library.allBooksRaw || []}
          list={activeList}
          onClose={() => setAddingBook(false)}
          onAdd={async (ids) => {
            await library.addBooksToList(activeList.id, ids);
            setAddingBook(false);
          }}
        />
      )}
    </div>
  );
}

function ListEditor({ list, onClose, onSave, onDelete }) {
  const [name, setName] = useState(list?.name || '');
  const [description, setDescription] = useState(list?.description || '');
  const [coverStyle, setCoverStyle] = useState(list?.coverStyle || 'gold');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">{list ? 'Edit list' : 'New list'}</span>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-scroll" style={{ padding: '0 20px 28px' }}>
          <label className={styles.field}>
            <span>Name</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Romance, Want to Read..." />
          </label>
          <label className={styles.field}>
            <span>Description</span>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" rows={3} />
          </label>
          <div className={styles.swatches}>
            {COVER_STYLES.map(style => (
              <button
                key={style}
                className={`${styles.coverStyle} ${styles[style]} ${coverStyle === style ? styles.selectedSwatch : ''}`}
                onClick={() => setCoverStyle(style)}
              />
            ))}
          </div>
          <button className="btn-primary" disabled={!name.trim()} onClick={() => onSave({ name, description, coverStyle })}>
            {list ? 'Save changes' : 'Create list'}
          </button>
          {list && <button className={styles.deleteBtn} onClick={() => onDelete(list.id)}>Delete list</button>}
        </div>
      </div>
    </div>
  );
}

function AddBooksSheet({ books, list, onClose, onAdd }) {
  const [selected, setSelected] = useState([]);
  const available = books.filter(book => !list.bookIds.includes(book.id));

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '80%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Add books</span>
          <button className="btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-scroll">
          {available.map(book => (
            <button key={book.id} className={styles.addRow} onClick={() => toggle(book.id)}>
              <BookCover book={book} size="small" />
              <span>
                <strong>{book.title}</strong>
                <small>{book.author}</small>
              </span>
              <b>{selected.includes(book.id) ? '✓' : ''}</b>
            </button>
          ))}
          {available.length === 0 && <div className={styles.emptyState}>All books are already in this list.</div>}
        </div>
        <div className={styles.addFooter}>
          <button className="btn-primary" disabled={selected.length === 0} onClick={() => onAdd(selected)}>
            Add {selected.length || ''} {selected.length === 1 ? 'book' : 'books'}
          </button>
        </div>
      </div>
    </div>
  );
}
