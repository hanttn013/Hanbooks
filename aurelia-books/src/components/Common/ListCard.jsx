// src/components/Common/ListCard.jsx
import Cover from './Cover';
import styles from './ListCard.module.css';
import { useI18n } from '../../i18n/context';
import { ActionMenu, MenuItem } from '@react-spectrum/s2/ActionMenu';

function formatRelativeTime(timestamp, locale = 'vi') {
  if (!timestamp) return '';
  const diffSec = Math.round((timestamp - Date.now()) / 1000);
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const absSec = Math.abs(diffSec);
    if (absSec < 60) return rtf.format(diffSec, 'second');
    const diffMin = Math.round(diffSec / 60);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    const diffHour = Math.round(diffMin / 60);
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    const diffDay = Math.round(diffHour / 24);
    if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
    const diffMonth = Math.round(diffDay / 30);
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
    return rtf.format(Math.round(diffDay / 365), 'year');
  } catch {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }
}

export default function ListCard({
  list,
  books = [],
  onOpenList,
  onEditList,
  onChangeCover,
  onDeleteList,
  className = '',
}) {
  const { t, locale } = useI18n();
  if (!list) return null;

  // Localize default seed list names & descriptions seamlessly
  let displayName = list.name;
  let displayDesc = list.description;
  if (list.id === 'reading-now' || list.name === 'Reading Now' || list.name === 'Đang đọc') {
    displayName = t('Reading Now');
    displayDesc = t('Stories in progress.');
  } else if (list.id === 'want-to-read' || list.name === 'Want to Read' || list.name === 'Muốn đọc') {
    displayName = t('Want to Read');
    displayDesc = t('Saved for a quieter evening.');
  } else if (list.id === 'romance' || list.name === 'Romance' || list.name === 'Văn học & Tình cảm') {
    displayName = t('Romance');
    displayDesc = t('Longing, restraint, and slow unfolding.');
  }

  // Gather up to 4 covers for composite preview if no custom cover
  const subCovers = books.slice(0, 4).map(b => b.coverUrl || b.coverImage || '');

  const handleClick = () => {
    if (onOpenList) onOpenList(list.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onOpenList) onOpenList(list.id);
    }
  };

  const timeStr = formatRelativeTime(list.updatedAt || list.createdAt, locale || 'vi');

  return (
    <article
      className={`${styles.listCard} list-tile ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
    >
      <div className={styles.avatarWrapper}>
        <Cover
          shape="square"
          src={list.coverImageUrl || list.customCoverUrl}
          type={list.coverImageUrl || list.customCoverUrl ? 'image' : (subCovers.length > 0 ? 'composite' : 'auto')}
          title={displayName}
          subCovers={subCovers}
          alt={displayName}
        />
      </div>

      <div className={styles.listContent}>
        <h3 className={styles.listTitle} title={displayName}>
          {displayName}
        </h3>
        <p className={styles.listMeta}>
          <span>{books.length} {t('books')}</span>
          {timeStr && <span> · {timeStr}</span>}
        </p>
        {displayDesc && (
          <p className={styles.listDescription} title={displayDesc}>
            {displayDesc}
          </p>
        )}
      </div>

      <div
        className={styles.actionMenuWrapper}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ActionMenu
          isQuiet
          size="S"
          aria-label={`${t('List options')}: ${displayName}`}
          onAction={(key) => {
            if (key === 'edit') onEditList?.(list);
            else if (key === 'changeCover') onChangeCover?.(list);
            else if (key === 'delete') onDeleteList?.(list.id);
          }}
        >
          <MenuItem id="edit">{t('Edit')}</MenuItem>
          <MenuItem id="changeCover">{t('Change cover')}</MenuItem>
          <MenuItem id="delete">{t('Delete')}</MenuItem>
        </ActionMenu>
      </div>
    </article>
  );
}
