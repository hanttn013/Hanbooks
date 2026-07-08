import { useMemo, useRef, useState } from 'react';
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
              <div className="brand-lockup">
                <img className="brand-logo" src="/branding/shanbooks-logo.png" alt="" />
                <p className="aurelia-wordmark">ShanBooks</p>
              </div>
              <h1 className="screen-title">Lists</h1>
              <p className={styles.subhead}>Shelves for series, genres, moods, and plans.</p>
            </div>
            <button className={styles.createBtn} onClick={() => setEditingList({})} title="Create list">+</button>
          </header>

          <div className="screen-scroll">
            <div className={styles.listStack}>
              {(library.lists || []).length === 0 && (
                <div className={styles.emptyPanel}>
                  <strong>No lists yet</strong>
                  <span>Create a list or import a ZIP/RAR archive to group books automatically.</span>
                </div>
              )}

              {(library.lists || []).map(list => {
                const previews = list.bookIds
                  .slice(0, 8)
                  .map(id => (library.allBooksRaw || []).find(book => book.id === id))
                  .filter(Boolean);
                const updatedAt = list.updatedAt || list.createdAt;
                return (
                  <button
                    key={list.id}
                    className={`${styles.listCard} ${styles[`${list.coverStyle || 'gold'}Card`] || styles.goldCard} ${list.coverImageUrl ? styles.imageCard : ''}`}
                    style={list.coverImageUrl ? { '--list-image': `url("${list.coverImageUrl}")` } : undefined}
                    onClick={() => setActiveListId(list.id)}
                  >
                    <span
                      className={`${styles.coverStyle} ${styles[list.coverStyle] || styles.gold} ${list.coverImageUrl ? styles.imageThumb : ''}`}
                      style={list.coverImageUrl ? { backgroundImage: `url("${list.coverImageUrl}")` } : undefined}
                    />
                    <span className={styles.listInfo}>
                      <strong>{list.name}</strong>
                      <small>{list.description || 'Personal reading shelf'}</small>
                      <small style={{marginBottom: 4}}>
                        {list.bookIds.length} {list.bookIds.length === 1 ? 'book' : 'books'}
                        {updatedAt ? ` - Updated ${new Date(updatedAt).toLocaleDateString()}` : ''}
                      </small>
                      {previews.length > 0 && (
                        <span className={styles.previewCovers}>
                          {previews.map(book => (
                            <img key={book.id} src={book.coverUrl || ''} alt="" />
                          ))}
                        </span>
                      )}
                    </span>
                    <span className={styles.chevron}>&rsaquo;</span>
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
            <button className={styles.backBtn} onClick={() => setActiveListId(null)}>&lsaquo; Lists</button>
            <div className={styles.detailTitleRow}>
              <span
                className={`${styles.coverStyle} ${styles[activeList.coverStyle] || styles.gold} ${activeList.coverImageUrl ? styles.imageThumb : ''}`}
                style={activeList.coverImageUrl ? { backgroundImage: `url("${activeList.coverImageUrl}")` } : undefined}
              />
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
                        <small>{book.genre || 'Fiction'} - {Math.round(progressFor(book))}%</small>
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
  const [coverImageUrl, setCoverImageUrl] = useState(list?.coverImageUrl || '');
  const imageRef = useRef(null);

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      setCoverImageUrl(dataUrl);
    } catch (err) {
      alert(err.message || 'Could not use this image.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">{list ? 'Edit list' : 'New list'}</span>
          <button className="btn-icon" onClick={onClose}>x</button>
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
          <div className={styles.imageTools}>
            <button type="button" onClick={() => imageRef.current?.click()}>
              {coverImageUrl ? 'Change background' : 'Upload background'}
            </button>
            {coverImageUrl && <button type="button" onClick={() => setCoverImageUrl('')}>Remove image</button>}
            <input ref={imageRef} type="file" accept="image/*" hidden onChange={handleImage} />
          </div>
          {coverImageUrl && <div className={styles.imagePreview} style={{ backgroundImage: `url("${coverImageUrl}")` }} />}
          <button className="btn-primary" disabled={!name.trim()} onClick={() => onSave({ name, description, coverStyle, coverImageUrl })}>
            {list ? 'Save changes' : 'Create list'}
          </button>
          {list && <button className={styles.deleteBtn} onClick={() => onDelete(list.id)}>Delete list</button>}
        </div>
      </div>
    </div>
  );
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type?.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const targetRatio = 3 / 2;
      let sx = 0;
      let sy = 0;
      let sw = image.width;
      let sh = image.height;
      if (image.width / image.height > targetRatio) {
        sw = Math.round(image.height * targetRatio);
        sx = Math.round((image.width - sw) / 2);
      } else {
        sh = Math.round(image.width / targetRatio);
        sy = Math.round((image.height - sh) / 2);
      }
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/webp', 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load this image.'));
    };
    image.src = url;
  });
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
          <button className="btn-icon" onClick={onClose}>x</button>
        </div>
        <div className="modal-scroll">
          {available.map(book => (
            <button key={book.id} className={styles.addRow} onClick={() => toggle(book.id)}>
              <BookCover book={book} size="small" />
              <span>
                <strong>{book.title}</strong>
                <small>{book.author}</small>
              </span>
              <b>{selected.includes(book.id) ? 'OK' : ''}</b>
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
