import Sheet from '../UI/Sheet';
import { Action } from '../UI/Controls';
import { useI18n } from '../../i18n/context';
export default function BookmarksModal({ bookmarks, onJumpTo, onRemove, onClose }) {
  const { t } = useI18n();
  return <Sheet title="Bookmarks" onClose={onClose}>
    {bookmarks.length ? bookmarks.slice().reverse().map(bookmark => <article key={bookmark.id} className="book-card">
      <h3>{bookmark.chapterTitle || t('Bookmark')}</h3><p>{bookmark.excerpt}</p>{bookmark.note && <p>{bookmark.note}</p>}
      <div className="action-row"><Action primary onPress={() => { onJumpTo(bookmark.cfi || bookmark.locator); onClose(); }}>{t('Read')}</Action><Action negative label={`${t('Delete')}: ${bookmark.chapterTitle || t('Bookmark')}`} onPress={() => onRemove(bookmark.id)}>{t('Delete')}</Action></div>
    </article>) : <p>{t('No bookmarks yet. Use ☆ to save this position.')}</p>}
  </Sheet>;
}
