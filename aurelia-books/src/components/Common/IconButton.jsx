// src/components/Common/IconButton.jsx
import { forwardRef } from 'react';
import { ActionButton as S2ActionButton } from '@react-spectrum/s2/ActionButton';
import styles from './IconButton.module.css';

/**
 * Standard app IconButton wrapper:
 * - 44px minimum touch target
 * - Perfect vertical & horizontal centering of SVG icons
 * - isQuiet by default for toolbars/headers
 */
const IconButton = forwardRef(function IconButton({
  children,
  className = '',
  size = 'M',
  isQuiet = true,
  'aria-label': ariaLabel,
  ...props
}, ref) {
  return (
    <S2ActionButton
      ref={ref}
      size={size}
      isQuiet={isQuiet}
      aria-label={ariaLabel}
      className={`${styles.iconButton} ${className}`}
      {...props}
    >
      {children}
    </S2ActionButton>
  );
});

export default IconButton;
