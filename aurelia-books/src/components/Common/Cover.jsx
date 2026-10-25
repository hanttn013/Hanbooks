// src/components/Common/Cover.jsx
import { useMemo } from 'react';
import styles from './Cover.module.css';

// Editorial harmonious gradient presets for generated covers (all high contrast >= 5:1 with white/cream text)
const WARM_GRADIENTS = [
  'linear-gradient(145deg, #1E3A5F 0%, #102238 100%)', // Deep Navy
  'linear-gradient(145deg, #6B3423 0%, #3D1C12 100%)', // Rich Terracotta
  'linear-gradient(145deg, #1B4533 0%, #0D261C 100%)', // Forest Pine
  'linear-gradient(145deg, #4A2846 0%, #281426 100%)', // Deep Plum
  'linear-gradient(145deg, #593D20 0%, #332110 100%)', // Antique Walnut
  'linear-gradient(145deg, #2E3642 0%, #161A20 100%)', // Slate Charcoal
];

function pickGradient(seedString = '') {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % WARM_GRADIENTS.length;
  return WARM_GRADIENTS[index];
}

function getInitial(text = '') {
  const clean = text.trim();
  if (!clean) return '';
  const match = clean.match(/[\p{L}\p{N}]/u);
  return match ? match[0].toUpperCase() : '';
}

export default function Cover({
  type = 'auto',
  src,
  title = '',
  author = '',
  subCovers = [],
  className = '',
  style = {},
  alt = '',
  loading = 'lazy',
  shape = 'book', // 'book' (2:3) or 'square' (1:1)
}) {
  const gradient = useMemo(() => pickGradient(title + (author || '')), [title, author]);
  const initial = useMemo(() => getInitial(title), [title]);

  const hasCustomImage = Boolean(src);
  const isComposite = !hasCustomImage && (type === 'composite' || (Array.isArray(subCovers) && subCovers.length > 0));
  const isImage = hasCustomImage;

  return (
    <div
      className={`${styles.coverContainer} ${shape === 'square' ? styles.squareCover : ''} ${className}`}
      style={style}
      aria-hidden={alt ? undefined : 'true'}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
    >
      {shape !== 'square' && <div className={styles.spineHighlight} />}

      {isImage ? (
        <img
          src={src}
          alt={alt || title}
          className={styles.coverImage}
          loading={loading}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextElementSibling) {
              e.currentTarget.nextElementSibling.style.display = 'flex';
            }
          }}
        />
      ) : isComposite ? (
        <div className={styles.compositeGrid}>
          {subCovers.slice(0, 4).map((subSrc, idx) => (
            subSrc ? (
              <img key={idx} src={subSrc} alt="" className={styles.compositeCell} />
            ) : (
              <div
                key={idx}
                className={styles.compositeCellFallback}
                style={{ background: pickGradient(`sub-${idx}-${title}`) }}
              />
            )
          ))}
          {Array.from({ length: Math.max(0, 4 - subCovers.length) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className={styles.compositeCellFallback}
              style={{ background: pickGradient(`empty-${idx}-${title}`) }}
            />
          ))}
        </div>
      ) : (
        <div className={styles.generatedCover} style={{ background: gradient }}>
          <div className={styles.monogram}>{initial}</div>
          <div className={styles.generatedTitle}>{title || 'Tác phẩm'}</div>
          {author && <div className={styles.generatedAuthor}>{author}</div>}
        </div>
      )}

      {/* Hidden fallback in case image errors out */}
      {isImage && (
        <div
          className={styles.generatedCover}
          style={{ background: gradient, display: 'none' }}
        >
          <div className={styles.monogram}>{initial}</div>
          <div className={styles.generatedTitle}>{title || 'Tác phẩm'}</div>
          {author && <div className={styles.generatedAuthor}>{author}</div>}
        </div>
      )}
    </div>
  );
}
