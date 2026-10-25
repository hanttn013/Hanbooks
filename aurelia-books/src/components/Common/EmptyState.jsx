import { Button } from '@react-spectrum/s2/Button';
import styles from './EmptyState.module.css';

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}) {
  return (
    <div className={`${styles.emptyContainer} ${className}`} role="status">
      <div className={styles.iconCircle}>
        {icon || (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            <path d="M8 7h8" />
            <path d="M8 11h6" />
          </svg>
        )}
      </div>

      {title && <h3 className={styles.emptyTitle}>{title}</h3>}
      {description && <p className={styles.emptyDescription}>{description}</p>}

      {actionLabel && onAction && (
        <div style={{ marginTop: 8 }}>
          <Button
            variant="accent"
            size="M"
            onPress={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
