// src/components/Common/Skeleton.jsx
import styles from './Skeleton.module.css';

export default function Skeleton({
  width = '100%',
  height = '16px',
  radius = 'var(--radius-sm)',
  className = '',
  style = {},
  variant = 'rect', // 'rect', 'circle', 'cover', 'text'
}) {
  const computedStyle = {
    width,
    height: variant === 'cover' ? undefined : height,
    aspectRatio: variant === 'cover' ? '2 / 3' : undefined,
    borderRadius: variant === 'circle' ? '50%' : radius,
    ...style,
  };

  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={computedStyle}
      aria-hidden="true"
    />
  );
}
