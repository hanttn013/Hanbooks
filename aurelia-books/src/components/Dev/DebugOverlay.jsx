// src/components/Dev/DebugOverlay.jsx
import { useEffect, useState, useRef } from 'react';

export default function DebugOverlay() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [buttonRects, setButtonRects] = useState([]);
  const frameRef = useRef(null);

  useEffect(() => {
    const checkState = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hasGuideParam = params.get('guides') === '1' || hash.includes('guides=1');
      const hasGuideStorage = localStorage.getItem('debug_guides') === '1';
      setIsEnabled(hasGuideParam || hasGuideStorage || Boolean(window.__DEBUG_GUIDES__));
    };

    checkState();
    window.__setDebugGuides = (val) => {
      window.__DEBUG_GUIDES__ = val;
      if (val) localStorage.setItem('debug_guides', '1');
      else localStorage.removeItem('debug_guides');
      setIsEnabled(Boolean(val));
    };

    window.addEventListener('storage', checkState);
    return () => window.removeEventListener('storage', checkState);
  }, []);

  const [insets, setInsets] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!isEnabled) return;

    const updateRects = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({ width: w, height: h });

      // Read safe-area insets
      const rootStyle = getComputedStyle(document.documentElement);
      const parsePx = (val) => {
        const num = parseFloat(val);
        return Number.isFinite(num) ? num : 0;
      };
      const topInset = parsePx(rootStyle.getPropertyValue('--safe-top')) || 0;
      const bottomInset = parsePx(rootStyle.getPropertyValue('--safe-bottom')) || 0;
      const leftInset = parsePx(rootStyle.getPropertyValue('--safe-left')) || 0;
      const rightInset = parsePx(rootStyle.getPropertyValue('--safe-right')) || 0;
      setInsets({ top: topInset, bottom: bottomInset, left: leftInset, right: rightInset });

      const selector = 'button, [role="button"], .edge-action, [data-rac], a[href], input, select';
      const elements = Array.from(document.querySelectorAll(selector));
      const rects = [];

      for (const el of elements) {
        // Skip hidden or tiny elements
        const r = el.getBoundingClientRect();
        if (r.width > 4 && r.height > 4 && r.top < h && r.bottom > 0) {
          const isSmall = r.width < 44 || r.height < 44;
          rects.push({
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            right: r.right,
            bottom: r.bottom,
            centerX: r.left + r.width / 2,
            centerY: r.top + r.height / 2,
            isSmall,
          });
        }
      }

      setButtonRects(rects);
      frameRef.current = requestAnimationFrame(updateRects);
    };

    frameRef.current = requestAnimationFrame(updateRects);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;

  return (
    <div
      id="debug-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 999999,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* 1. Status Bar Forbidden Zone (Vùng cấm Status Bar) */}
      {insets.top > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: insets.top,
            backgroundColor: 'rgba(255, 0, 85, 0.22)',
            borderBottom: '1px solid #ff0055',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffffff',
            textShadow: '0 1px 2px #000',
            letterSpacing: '0.5px',
          }}
        >
          ⛔ VÙNG CẤM: STATUS BAR ({Math.round(insets.top)}px)
        </div>
      )}

      {/* 2. Gesture Bar Forbidden Zone (Vùng cấm Thanh cử chỉ) */}
      {insets.bottom > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: insets.bottom,
            backgroundColor: 'rgba(255, 0, 85, 0.22)',
            borderTop: '1px solid #ff0055',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#ffffff',
            textShadow: '0 1px 2px #000',
            letterSpacing: '0.5px',
          }}
        >
          ⛔ VÙNG CẤM: GESTURE BAR ({Math.round(insets.bottom)}px)
        </div>
      )}

      {/* 3. Left 16px margin guide line (red) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 16,
          width: 1,
          backgroundColor: '#ff0055',
          boxShadow: '0 0 2px rgba(255, 0, 85, 0.8)',
        }}
      />

      {/* 4. Right 16px margin guide line (red) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 16,
          width: 1,
          backgroundColor: '#ff0055',
          boxShadow: '0 0 2px rgba(255, 0, 85, 0.8)',
        }}
      />

      {/* 5. Tâm màn hình (Screen center crosshair lines) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: centerX,
          width: 1,
          backgroundColor: '#00d4ff',
          opacity: 0.6,
          borderLeft: '1px dashed #00d4ff',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: centerY,
          height: 1,
          backgroundColor: '#00d4ff',
          opacity: 0.6,
          borderTop: '1px dashed #00d4ff',
        }}
      />

      {/* SVG overlay for button bounding boxes and touch target validation */}
      <svg
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      >
        {buttonRects.map((r, i) => (
          <g key={i}>
            {/* Bounding box: green if valid ≥44px, red warning if <44px */}
            <rect
              x={r.left}
              y={r.top}
              width={r.width}
              height={r.height}
              fill={r.isSmall ? 'rgba(255, 0, 0, 0.12)' : 'none'}
              stroke={r.isSmall ? '#ff1744' : '#00e676'}
              strokeWidth={r.isSmall ? '1.5' : '1'}
              strokeDasharray={r.isSmall ? 'none' : '3 2'}
              opacity="0.9"
            />
            {/* Centerline through center of button box */}
            <line
              x1={r.left}
              y1={r.centerY}
              x2={r.right}
              y2={r.centerY}
              stroke={r.isSmall ? '#ff5252' : '#ffea00'}
              strokeWidth="1"
              opacity="0.8"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
