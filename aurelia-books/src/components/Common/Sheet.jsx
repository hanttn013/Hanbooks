import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import IconButton from './IconButton';
import EdgeAction from './EdgeAction';
import styles from './Sheet.module.css';
import { useI18n } from '../../i18n/context';

export default function Sheet({
  isOpen = true,
  onClose,
  title,
  children,
  footer,
  sidePanel = false,
  fullHeight = false,
  hideDefaultHeader = false,
  className = '',
}) {
  const { t } = useI18n();
  const contentRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap / initial focus
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const focusable = contentRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const sheetElement = (
    <div
      className={`${styles.backdrop} ${sidePanel ? styles.sidePanelVariant : ''} ${fullHeight ? styles.backdropFullHeight : ''} ${className}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
    >
      <div className={`${styles.sheetContent} ${fullHeight ? styles.fullHeightVariant : ''}`} ref={contentRef}>
        {!sidePanel && !hideDefaultHeader && (
          <div className={styles.dragHandleArea} aria-hidden="true">
            <div className={styles.dragHandle} />
          </div>
        )}

        {!hideDefaultHeader ? (
          <div className={styles.sheetHeader}>
            <h2 id="sheet-title" className={styles.sheetTitle}>
              {title}
            </h2>
            <EdgeAction edge="right" offset={17}>
              <IconButton
                onPress={onClose}
                aria-label={t('Close')}
                size="M"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </IconButton>
            </EdgeAction>
          </div>
        ) : (
          <h2 id="sheet-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            {title}
          </h2>
        )}

        <div className={styles.sheetBody}>
          {children}
        </div>

        {footer && (
          <div className={styles.sheetFooter}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(sheetElement, document.body);
}
