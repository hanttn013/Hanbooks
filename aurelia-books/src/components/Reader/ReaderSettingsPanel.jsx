// src/components/Reader/ReaderSettingsPanel.jsx
// Quick settings accessible from within the reader
import { motion } from 'framer-motion';

const THEMES = [
  { id: 'warm-cream', label: 'Cream', bg: '#EDE8DC', text: '#2C2416' },
  { id: 'pure-white', label: 'White', bg: '#FFFFFF', text: '#1A1A1A' },
  { id: 'sepia', label: 'Sepia', bg: '#F1E4C3', text: '#3B2F0A' },
  { id: 'dark-gray', label: 'Dark', bg: '#2A2A2A', text: '#E8E0D0' },
  { id: 'amoled-black', label: 'Black', bg: '#000000', text: '#E0D8C8' },
  { id: 'forest', label: 'Forest', bg: '#1C3329', text: '#E8F0E8' },
];

const READING_MODES = [
  { id: 'classic', label: 'Pages' },
  { id: 'scroll', label: 'Scroll' },
];

export default function ReaderSettingsPanel({ settings, updateSetting, onClose }) {
  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ justifyContent: 'flex-end' }}
    >
      <motion.div
        className="modal-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 32 }}
      >
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">Reading Settings</span>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '0 20px', overflow: 'hidden' }}>
          {/* Font Size */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
              <span>Font Size</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{settings.fontSize}px</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => updateSetting('fontSize', Math.max(14, settings.fontSize - 1))}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >−</button>
              <input
                type="range" min="14" max="28" step="1"
                value={settings.fontSize}
                onChange={e => updateSetting('fontSize', parseInt(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <button
                onClick={() => updateSetting('fontSize', Math.min(28, settings.fontSize + 1))}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >+</button>
            </div>
          </div>

          {/* Line Height */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
              <span>Line Spacing</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{settings.lineHeight.toFixed(1)}</span>
            </div>
            <input
              type="range" min="1.2" max="2.4" step="0.1"
              value={settings.lineHeight}
              onChange={e => updateSetting('lineHeight', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Reading Mode */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>Reading Mode</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {READING_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => updateSetting('readingMode', mode.id)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: '1.5px solid',
                    borderColor: settings.readingMode === mode.id ? 'var(--accent)' : 'var(--border)',
                    background: settings.readingMode === mode.id ? 'var(--accent-dark)' : 'var(--bg-secondary)',
                    color: settings.readingMode === mode.id ? '#F5E6C0' : 'var(--text-secondary)',
                    fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme quick-select */}
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>Theme</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {THEMES.map(theme => (
                <motion.button
                  key={theme.id}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => updateSetting('theme', theme.id)}
                  style={{
                    flex: 1, height: 42, borderRadius: 10,
                    border: `2px solid ${settings.theme === theme.id ? 'var(--accent)' : 'transparent'}`,
                    background: theme.bg,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'border 150ms ease',
                    boxShadow: settings.theme === theme.id ? '0 0 0 1px var(--accent)' : '0 1px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <span style={{ fontFamily: 'Georgia', fontSize: 13, color: theme.text, fontWeight: 500 }}>Aa</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
