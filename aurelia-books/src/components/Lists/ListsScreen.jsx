import { useMemo, useRef, useState } from 'react';
import { TextArea } from '@react-spectrum/s2/TextArea';
import { Checkbox } from '@react-spectrum/s2/Checkbox';
import { ToastQueue } from '@react-spectrum/s2/Toast';
import BookCover from '../Library/BookCover';
import { Action, Choice, Field } from '../UI/Controls';
import Sheet from '../UI/Sheet';
import { useConfirm } from '../UI/feedbackContext';
import { useI18n } from '../../i18n/context';
import { readProgressPercent } from '../../utils/storageKeys';

const SORT_OPTIONS = [{ value: 'lastOpenedAt', label: 'Recently Opened' }, { value: 'addedAt', label: 'Recently Added' }, { value: 'title', label: 'Title A-Z' }, { value: 'author', label: 'Author A-Z' }, { value: 'progress', label: 'Progress' }];
function sortBooks(books, mode) {
  return [...books].sort((a, b) => mode === 'title' ? a.title.localeCompare(b.title) : mode === 'author' ? a.author.localeCompare(b.author) : mode === 'progress' ? readProgressPercent(b) - readProgressPercent(a) : (b[mode] || 0) - (a[mode] || 0));
}
export default function ListsScreen({ library, activeListId, setActiveListId, onOpenBook, onOpenBookInfo }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [editingList, setEditingList] = useState(null);
  const [addingBook, setAddingBook] = useState(false);
  const activeList = (library.lists || []).find(list => list.id === activeListId) || null;
  const activeBooks = useMemo(() => activeList ? sortBooks(activeList.bookIds.map(id => library.allBooksRaw.find(book => book.id === id)).filter(Boolean), activeList.sortBy || 'addedAt') : [], [activeList, library.allBooksRaw]);
  return <div className="screen-container">
    <header className="page-layout safe-top" style={{ paddingBottom: 0, gap: 12 }}><p className="aurelia-wordmark">ShanBooks</p>
      {activeList ? <><div><Action onPress={() => setActiveListId(null)}>{t('Lists')}</Action></div><h1 className="screen-title">{activeList.name}</h1><p>{activeList.description}</p>
        <div className="action-row"><Choice label="Sort books" value={activeList.sortBy || 'addedAt'} onChange={value => library.updateList(activeList.id, { sortBy: value })} options={SORT_OPTIONS} /><Action primary onPress={() => setAddingBook(true)}>{t('Add')}</Action><Action onPress={() => setEditingList(activeList)}>{t('Edit')}</Action></div>
      </> : <><div className="section-heading"><h1 className="screen-title">{t('Lists')}</h1><Action primary onPress={() => setEditingList({})}>{t('Create list')}</Action></div><p>{t('Shelves for series, genres, moods, and plans.')}</p></>}
    </header>
    <div className="screen-scroll"><main className="page-layout">
      {!activeList ? <div className="field-grid">{(library.lists || []).map(list => <article className="list-tile" key={list.id}>
        <div className={`list-tile-cover list-cover-${list.coverStyle || 'gold'}`} style={list.coverImageUrl ? { backgroundImage: `url("${list.coverImageUrl}")` } : undefined} />
        <h2>{list.name}</h2><p>{list.description || t('Personal reading shelf')}</p><p>{t('booksCount', { count: list.bookIds.length })}</p>
        <Action onPress={() => setActiveListId(list.id)}>{t('Read')}</Action>
      </article>)}{!library.lists?.length && <section className="empty-state"><h2>{t('No lists yet')}</h2><p>{t('Create a list or import a ZIP/RAR archive to group books automatically.')}</p></section>}</div>
      : activeBooks.length ? <div className="book-cards">{activeBooks.map(book => <article className="book-card" key={book.id}><BookCover book={book} size="medium" /><h2 style={{ fontSize: 16 }}>{book.title}</h2><p>{book.author}</p><p>{t('completePercent', { count: Math.round(readProgressPercent(book)) })}</p><div className="action-row"><Action primary onPress={() => onOpenBook(book)}>{t('Read')}</Action><Action onPress={() => onOpenBookInfo(book)}>{t('Info')}</Action><Action onPress={() => library.removeBookFromList(activeList.id, book.id)}>{t('Remove')}</Action></div></article>)}</div>
      : <section className="empty-state"><p>{t('This list is empty. Add books from your library.')}</p><Action onPress={() => setAddingBook(true)}>{t('Add books')}</Action></section>}
    </main></div>
    {editingList && <ListEditor list={editingList.id ? editingList : null} onClose={() => setEditingList(null)}
      onDelete={async id => { if (!await confirm(t('deleteListConfirm'))) return; await library.deleteList(id); setEditingList(null); setActiveListId(null); }}
      onSave={async input => { if (editingList.id) await library.updateList(editingList.id, input); else await library.createList(input); setEditingList(null); }} />}
    {addingBook && activeList && <AddBooksSheet books={library.allBooksRaw || []} list={activeList} onClose={() => setAddingBook(false)} onAdd={async ids => { await library.addBooksToList(activeList.id, ids); setAddingBook(false); }} />}
  </div>;
}
function ListEditor({ list, onClose, onSave, onDelete }) {
  const { t } = useI18n();
  const [name, setName] = useState(list?.name || '');
  const [description, setDescription] = useState(list?.description || '');
  const [coverStyle, setCoverStyle] = useState(list?.coverStyle || 'gold');
  const [coverImageUrl, setCoverImageUrl] = useState(list?.coverImageUrl || '');
  const [busy, setBusy] = useState(false);
  const imageRef = useRef(null);
  const save = async () => { setBusy(true); try { await onSave({ name: name.trim(), description, coverStyle, coverImageUrl }); } catch (error) { ToastQueue.negative(t(error.message)); } finally { setBusy(false); } };
  return <Sheet title={list ? 'Edit list' : 'New list'} onClose={onClose} busy={busy} footer={<><Action primary disabled={!name.trim() || busy} onPress={save}>{t(list ? 'Save changes' : 'Create list')}</Action>{list && <Action negative onPress={async () => { setBusy(true); try { await onDelete(list.id); } catch (error) { ToastQueue.negative(t(error.message)); } finally { setBusy(false); } }} disabled={busy}>{t('Delete list')}</Action>}</>}>
    <Field label="Name" value={name} onChange={setName} autoFocus isRequired />
    <TextArea label={t('Description')} value={description} onChange={setDescription} />
    <Choice label="Cover color" value={coverStyle} onChange={setCoverStyle} options={['gold', 'cream', 'burgundy', 'forest', 'ink'].map(id => ({ id, label: id }))} />
    <div className="action-row"><Action onPress={() => imageRef.current?.click()}>{t(coverImageUrl ? 'Change background' : 'Upload background')}</Action>{coverImageUrl && <Action onPress={() => setCoverImageUrl('')}>{t('Remove image')}</Action>}</div>
    <input aria-label={t('Upload background')} ref={imageRef} type="file" accept="image/*" hidden onChange={async event => { const file = event.target.files?.[0]; if (!file) return; try { setCoverImageUrl(await resizeImage(file)); } catch (error) { ToastQueue.negative(t(error.message)); } finally { event.target.value = ''; } }} />
    {coverImageUrl && <img src={coverImageUrl} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }} />}
  </Sheet>;
}
function AddBooksSheet({ books, list, onClose, onAdd }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const available = books.filter(book => !list.bookIds.includes(book.id));
  return <Sheet title="Add books" onClose={onClose} busy={busy} footer={<Action primary disabled={!selected.length || busy} onPress={async () => { setBusy(true); try { await onAdd(selected); } catch (error) { ToastQueue.negative(t(error.message)); } finally { setBusy(false); } }}>{t('Add')} ({selected.length})</Action>}>
    {available.map(book => <Checkbox key={book.id} isSelected={selected.includes(book.id)} onChange={checked => setSelected(previous => checked ? [...previous, book.id] : previous.filter(id => id !== book.id))}>{book.title} — {book.author}</Checkbox>)}
    {!available.length && <p>{t('All books are already in this list.')}</p>}
  </Sheet>;
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
