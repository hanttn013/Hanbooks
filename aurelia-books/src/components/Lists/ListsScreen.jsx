import { useMemo, useRef, useState } from 'react';
import { ToastQueue } from '@react-spectrum/s2/Toast';
import { useConfirm } from '../UI/feedbackContext';
import { useI18n } from '../../i18n/context';
import { readProgressPercent } from '../../utils/storageKeys';
import PageHeader from '../Common/PageHeader';
import ListCard from '../Common/ListCard';
import BookCard from '../Common/BookCard';
import BookQuickPreviewModal from '../Library/BookQuickPreviewModal';
import Cover from '../Common/Cover';
import EmptyState from '../Common/EmptyState';
import Sheet from '../UI/Sheet';
import Button from '../Common/Button';
import IconButton from '../Common/IconButton';
import EdgeAction from '../Common/EdgeAction';
import { ActionMenu, MenuItem } from '@react-spectrum/s2/ActionMenu';
import { TextField } from '@react-spectrum/s2/TextField';
import { Picker, PickerItem } from '@react-spectrum/s2/Picker';
import { Checkbox } from '@react-spectrum/s2/Checkbox';
import { processListCoverImage } from '../../utils/imageCoverProcessor';
import styles from './ListsScreen.module.css';

const SORT_OPTIONS = [
  { value: 'lastOpenedAt', label: 'Recently Opened' },
  { value: 'addedAt', label: 'Recently Added' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'author', label: 'Author A-Z' },
  { value: 'progress', label: 'Progress' },
];

function sortBooks(books, mode) {
  return [...books].sort((a, b) => {
    if (mode === 'title') return a.title.localeCompare(b.title);
    if (mode === 'author') return (a.author || '').localeCompare(b.author || '');
    if (mode === 'progress') return readProgressPercent(b) - readProgressPercent(a);
    return (b[mode] || 0) - (a[mode] || 0);
  });
}

export default function ListsScreen({
  library,
  activeListId,
  setActiveListId,
  onOpenBook,
  onOpenBookInfo,
}) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const [editingList, setEditingList] = useState(null);
  const [addingBook, setAddingBook] = useState(false);
  const [quickPreviewBook, setQuickPreviewBook] = useState(null);

  const lists = useMemo(() => library.lists || [], [library.lists]);
  const activeList = useMemo(() => lists.find(list => list.id === activeListId) || null, [lists, activeListId]);
  const allBooks = useMemo(() => library.allBooksRaw || [], [library.allBooksRaw]);

  const activeBooks = useMemo(() => {
    if (!activeList) return [];
    const booksInList = activeList.bookIds
      .map(id => allBooks.find(b => b.id === id))
      .filter(Boolean);
    return sortBooks(booksInList, activeList.sortBy || 'addedAt');
  }, [activeList, allBooks]);

  return (
    <div className={styles.screen}>
      {activeList ? (
        <PageHeader
          title={activeList.name}
          subtitle={activeList.description || t('Personal reading shelf')}
          actions={
            <div className={styles.headerActions}>
              <Button
                variant="secondary"
                size="S"
                onPress={() => setActiveListId(null)}
              >
                {t('Lists')}
              </Button>
              <Button
                variant="accent"
                size="S"
                onPress={() => setAddingBook(true)}
              >
                {t('Add books')}
              </Button>
              <ActionMenu
                isQuiet
                size="S"
                aria-label={`${t('List options')}: ${activeList.name}`}
                onAction={(key) => {
                  if (key === 'edit') setEditingList(activeList);
                  else if (key === 'changeCover') setEditingList({ ...activeList, focusCover: true });
                  else if (key === 'delete') {
                    (async () => {
                      if (!await confirm(t('deleteListConfirm'))) return;
                      await library.deleteList(activeList.id);
                      setActiveListId(null);
                    })();
                  }
                }}
              >
                <MenuItem id="edit">{t('Edit list')}</MenuItem>
                <MenuItem id="changeCover">{t('Change cover')}</MenuItem>
                <MenuItem id="delete">{t('Delete list')}</MenuItem>
              </ActionMenu>
            </div>
          }
        />
      ) : (
        <PageHeader
          title={t('Lists')}
          subtitle={t('Shelves for series, genres, moods, and plans.')}
          actions={
            <Button
              variant="accent"
              size="S"
              onPress={() => setEditingList({})}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>{t('Create list')}</span>
            </Button>
          }
        />
      )}

      <div className={`${styles.scrollArea} screen-scroll`}>
        <div className={styles.container}>
          {!activeList ? (
            lists.length > 0 ? (
              <div className={styles.listsGrid}>
                {lists.map(list => {
                  const listBooks = list.bookIds
                    .map(id => allBooks.find(b => b.id === id))
                    .filter(Boolean);
                  return (
                    <ListCard
                      key={list.id}
                      list={list}
                      books={listBooks}
                      onOpenList={setActiveListId}
                      onEditList={(l) => setEditingList(l)}
                      onChangeCover={(l) => setEditingList({ ...l, focusCover: true })}
                      onDeleteList={async (id) => {
                        if (!await confirm(t('deleteListConfirm'))) return;
                        await library.deleteList(id);
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title={t('No lists yet')}
                description={t('Create a list or import a ZIP/RAR archive to group books automatically.')}
                actionLabel={t('Create list')}
                onAction={() => setEditingList({})}
              />
            )
          ) : (
            <>
              <div className={styles.activeListBar}>
                <div className={styles.activeListControls}>
                  <span className={styles.sortLabel}>
                    {activeBooks.length} {t('books')}
                  </span>
                  <Picker
                    size="S"
                    aria-label={t('Sort by')}
                    selectedKey={activeList.sortBy || 'addedAt'}
                    onSelectionChange={key => {
                      if (key) library.updateList(activeList.id, { sortBy: key });
                    }}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <PickerItem key={opt.value} id={opt.value}>
                        {t(opt.label)}
                      </PickerItem>
                    ))}
                  </Picker>
                </div>
              </div>

              {activeBooks.length > 0 ? (
                <div className={styles.booksGrid}>
                  {activeBooks.map(book => (
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
                  title={t('This list is empty')}
                  description={t('Add books from your library to this list.')}
                  actionLabel={t('Add books')}
                  onAction={() => setAddingBook(true)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {editingList && (
        <ListEditor
          list={editingList.id ? editingList : null}
          onClose={() => setEditingList(null)}
          onDelete={async id => {
            setEditingList(null);
            if (!await confirm(t('deleteListConfirm'))) return;
            await library.deleteList(id);
            setActiveListId(null);
          }}
          onSave={async input => {
            if (editingList.id) await library.updateList(editingList.id, input);
            else await library.createList(input);
            setEditingList(null);
          }}
        />
      )}

      {addingBook && activeList && (
        <AddBooksSheet
          books={allBooks}
          list={activeList}
          onClose={() => setAddingBook(false)}
          onAdd={async ids => {
            await library.addBooksToList(activeList.id, ids);
            setAddingBook(false);
          }}
        />
      )}

      {/* Quick Preview Modal for Lists */}
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
        onAddToList={() => {}}
      />
    </div>
  );
}

function ListEditor({ list, onClose, onSave, onDelete }) {
  const { t } = useI18n();
  const [name, setName] = useState(list?.name || '');
  const [description, setDescription] = useState(list?.description || '');
  const coverStyle = list?.coverStyle || 'gold';
  const [coverImageUrl, setCoverImageUrl] = useState(list?.coverImageUrl || '');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const result = await processListCoverImage(file);
      setCoverImageUrl(result.dataUrl);
      ToastQueue.positive(t('Cover image selected'));
    } catch (err) {
      console.error('Failed to process cover image:', err);
      ToastQueue.negative(t(err.message || 'Could not load this image.'));
    } finally {
      setBusy(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUseAutoCover = () => {
    setCoverImageUrl('');
    ToastQueue.positive(t('Using automatic cover'));
  };

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave({ name: name.trim(), description, coverStyle, coverImageUrl });
    } catch (error) {
      ToastQueue.negative(t(error.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      title={list?.id ? t('Edit list') : t('New list')}
      onClose={onClose}
      busy={busy}
      footer={
        <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'flex-end' }}>
          {list?.id && (
            <Button
              variant="negative"
              size="M"
              onPress={() => onDelete(list.id)}
            >
              {t('Delete list')}
            </Button>
          )}
          <Button
            variant="accent"
            size="M"
            isDisabled={!name.trim() || busy}
            onPress={save}
          >
            {t(list?.id ? 'Save changes' : 'Create list')}
          </Button>
        </div>
      }
    >
      <div className={styles.modalForm}>
        {/* Cover Preview and Selection */}
        <div className={styles.coverSection}>
          <div className={styles.coverPreviewWrapper}>
            <Cover
              shape="square"
              src={coverImageUrl}
              type={coverImageUrl ? 'image' : 'auto'}
              title={name || t('List')}
              alt={name || t('List')}
            />
          </div>
          <div className={styles.coverActions}>
            <span className={styles.coverLabel}>{t('Cover image')}</span>
            <div className={styles.coverButtonRow}>
              <Button
                variant="secondary"
                size="S"
                onPress={() => fileInputRef.current?.click()}
              >
                {t('Choose image')}
              </Button>
              {coverImageUrl && (
                <Button
                  variant="secondary"
                  size="S"
                  onPress={handleUseAutoCover}
                >
                  {t('Use automatic cover')}
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleFileChange}
            />
          </div>
        </div>

        <TextField
          label={t('Name')}
          value={name}
          onChange={setName}
          isRequired
          autoFocus={!list?.focusCover}
        />
        <TextField
          label={t('Description')}
          value={description}
          onChange={setDescription}
        />
      </div>
    </Sheet>
  );
}

function AddBooksSheet({ books, list, onClose, onAdd }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const available = books.filter(book => !list.bookIds.includes(book.id));

  return (
    <Sheet
      title={t('Add books')}
      onClose={onClose}
      busy={busy}
      footer={
        <Button
          variant="accent"
          size="M"
          isDisabled={!selected.length || busy}
          onPress={async () => {
            setBusy(true);
            try {
              await onAdd(selected);
            } catch (error) {
              ToastQueue.negative(t(error.message));
            } finally {
              setBusy(false);
            }
          }}
        >
          {`${t('Add')} (${selected.length})`}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0', maxHeight: '60vh', overflowY: 'auto' }}>
        {available.map(book => (
          <div
            key={book.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              background: selected.includes(book.id) ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              border: `1px solid ${selected.includes(book.id) ? 'var(--accent)' : 'var(--border-subtle)'}`,
              cursor: 'pointer',
            }}
            onClick={() => {
              setSelected(prev => prev.includes(book.id) ? prev.filter(id => id !== book.id) : [...prev, book.id]);
            }}
          >
            <Checkbox
              isSelected={selected.includes(book.id)}
              onChange={checked => {
                setSelected(prev => checked ? [...prev, book.id] : prev.filter(id => id !== book.id));
              }}
              aria-label={book.title}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {book.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {book.author || t('Unknown author')}
              </div>
            </div>
          </div>
        ))}
        {!available.length && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 20 }}>
            {t('All books are already in this list.')}
          </p>
        )}
      </div>
    </Sheet>
  );
}
