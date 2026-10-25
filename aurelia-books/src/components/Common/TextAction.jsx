// src/components/Common/TextAction.jsx
import { forwardRef } from 'react';
import { ActionButton as S2ActionButton } from '@react-spectrum/s2/ActionButton';
import styles from './TextAction.module.css';

/**
 * Standard app TextAction wrapper for secondary text actions (like "Xem thêm", "Xoá tất cả", "Huỷ"):
 * - 44px min touch target
 * - inline-flex centering with text-box trim
 */
const TextAction = forwardRef(function TextAction({
  children,
  className = '',
  size = 'S',
  isQuiet = true,
  ...props
}, ref) {
  return (
    <S2ActionButton
      ref={ref}
      size={size}
      isQuiet={isQuiet}
      className={`${styles.textAction} ${className}`}
      {...props}
    >
      {children}
    </S2ActionButton>
  );
});

export default TextAction;
