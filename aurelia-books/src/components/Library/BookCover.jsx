// src/components/Library/BookCover.jsx
// Renders a beautiful book cover - either from uploaded image or generated from metadata
import styles from './BookCover.module.css';

export default function BookCover({ book, size = 'medium', style = {} }) {
  const sizeMap = {
    small: { width: 52, height: 78 },
    medium: { width: 100, height: 150 },
    large: { width: 120, height: 180 },
    shelf: { width: 90, height: 135 },
    hero: { width: 110, height: 165 },
  };

  const dims = sizeMap[size] || sizeMap.medium;

  return (
    <div
      className={styles.cover}
      style={{
        width: dims.width,
        height: dims.height,
        backgroundColor: book.coverColor || '#2D4A6E',
        ...style,
      }}
    >
      {/* Texture overlay */}
      <div className={styles.texture} />
      {/* Top ornament */}
      <div className={styles.ornament}>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
          <path d="M8 0 L16 4 L8 8 L0 4 Z" fill={book.coverAccent || '#C4A35A'} opacity="0.8"/>
          <circle cx="8" cy="4" r="2" fill={book.coverAccent || '#C4A35A'}/>
        </svg>
      </div>
      {/* Title */}
      <div className={styles.titleArea}>
        <div
          className={styles.title}
          style={{
            color: book.coverAccent || '#C4A35A',
            fontSize: dims.width < 70 ? 8 : dims.width < 100 ? 10 : 11,
          }}
        >
          {book.title}
        </div>
      </div>
      {/* Divider line */}
      <div
        className={styles.dividerLine}
        style={{ backgroundColor: `${book.coverAccent || '#C4A35A'}60` }}
      />
      {/* Author */}
      <div
        className={styles.author}
        style={{
          color: `${book.coverAccent || '#C4A35A'}CC`,
          fontSize: dims.width < 70 ? 6 : dims.width < 100 ? 7 : 8,
        }}
      >
        {book.author}
      </div>
      {/* Spine shadow */}
      <div className={styles.spineShadow} />
    </div>
  );
}
