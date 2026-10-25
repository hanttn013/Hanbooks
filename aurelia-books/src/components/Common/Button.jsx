// src/components/Common/Button.jsx
import { forwardRef } from 'react';
import { Button as S2Button } from '@react-spectrum/s2/Button';
import styles from './Button.module.css';

/**
 * Standard app Button wrapper ensuring root vertical centering:
 * - display: inline-flex; align-items: center; justify-content: center
 * - Proper line-height and text metric alignment
 * - Accessible 44px min touch target
 */
const Button = forwardRef(function Button({
  className = '',
  style,
  children,
  variant = 'primary',
  size = 'M',
  UNSAFE_className: propUnsafeClass = '',
  UNSAFE_style: propUnsafeStyle,
  ...props
}, ref) {
  // Check if text has descenders (g, j, p, q, y)
  const textContent = typeof children === 'string' ? children : '';
  const hasDescenders = /[gjpqy]/i.test(textContent);

  const variantClass = variant === 'accent'
    ? styles.variantAccent
    : variant === 'primary'
    ? styles.variantPrimary
    : '';

  const combinedClass = `${styles.appButton} ${variantClass} ${className} ${propUnsafeClass}`.trim();
  const combinedStyle = { ...style, ...propUnsafeStyle };

  return (
    <S2Button
      ref={ref}
      variant={variant}
      size={size}
      data-variant={variant}
      data-descenders={hasDescenders ? 'yes' : 'no'}
      data-size={size}
      className={combinedClass}
      UNSAFE_className={combinedClass}
      style={combinedStyle}
      UNSAFE_style={combinedStyle}
      {...props}
    >
      {children}
    </S2Button>
  );
});

export default Button;
