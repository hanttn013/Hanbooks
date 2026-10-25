// src/components/Common/EdgeAction.jsx
import { forwardRef } from 'react';
import styles from './EdgeAction.module.css';

/**
 * EdgeAction component:
 * - Guarantees 44dp minimum touch target
 * - Visual ink (glyph / text) sits flush at the exact 16px margin line (±2px)
 * - Negative margin equals half of the touch target padding: (44 - glyphWidth) / 2
 * - Supports edge="right" (default) or edge="left"
 */
const EdgeAction = forwardRef(function EdgeAction({
  edge = 'right',
  glyphWidth = 20,
  isText = false,
  offset = null,
  children,
  className = '',
  style = {},
  ...props
}, ref) {
  // If offset is explicitly passed, use it directly.
  // If text, the button touches the 16px container margin with padding: 0.
  // For glyphs, negative margin equals half of the remaining touch target: (44 - glyphWidth) / 2.
  const halfPadding = offset !== null
    ? offset
    : (isText ? 0 : Math.max(0, Math.round((44 - glyphWidth) / 2)));

  const edgeStyle = {
    ...style,
    ...(edge === 'right' ? { marginRight: `-${halfPadding}px` } : { marginLeft: `-${halfPadding}px` }),
  };

  return (
    <div
      ref={ref}
      className={`${styles.edgeActionWrapper} ${edge === 'right' ? styles.edgeRight : styles.edgeLeft} ${isText ? styles.isTextAction : ''} ${className}`}
      style={edgeStyle}
      {...props}
    >
      {children}
    </div>
  );
});

export default EdgeAction;
