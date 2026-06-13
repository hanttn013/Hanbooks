// src/components/Appearance/AppearanceScreen.jsx
import { motion } from 'framer-motion';
import styles from './AppearanceScreen.module.css';

const THEMES = [
  { id: 'pure-white', label: 'Pure White', bg: '#FFFFFF', text: '#1A1A1A', border: '#E0E0E0' },
  { id: 'warm-cream', label: 'Warm Cream', bg: '#EDE8DC', text: '#2C2416', border: '#C4A35A' },
  { id: 'vintage-paper', label: 'Vintage Paper', bg: '#F5EDD6', text: '#3D2B1F', border: 'transparent' },
  { id: 'sepia', label: 'Sepia', bg: '#F1E4C3', text: '#3B2F0A', border: 'transparent' },
  { id: 'dark-gray', label: 'Dark Gray', bg: '#2A2A2A', text: '#E8E0D0', border: 'transparent' },
  { id: 'amoled-black', label: 'AMOLED Black', bg: '#000000', text: '#E0D8C8', border: '#333' },
  { id: 'forest', label: 'Forest', bg: '#1C3329', text: '#E8F0E8', border: 'transparent' },
  { id: 'ocean', label: 'Ocean', bg: '#E8F4F8', text: '#1A3040', border: 'transparent' },
  { id: 'midnight-blue', label: 'Midnight Blue', bg: '#1A2035', text: '#D8E0F0', border: 'transparent' },
];

const FONTS = [
  { id: 'Merriweather', label: 'Merriweather' },
  { id: 'EB Garamond', label: 'EB Garamond' },
  { id: 'Literata', label: 'Literata' },
  { id: 'Crimson Pro', label: 'Crimson Pro' },
  { id: 'Noto Serif', label: 'Noto Serif' },
  { id: 'Georgia', label: 'Georgia' },
  { id: 'Times New Roman', label: 'Times New Roman' },
];

const READING_MODES = [
  { id: 'classic', label: 'Classic Page' },
  { id: 'realbook', label: 'Real Book' },
  { id: 'scroll', label: 'Continuous Scroll' },
];

const PAGE_EFFECTS = [
  { id: 'none', label: 'None' },
  { id: 'slide', label: 'Slide' },
  { id: 'realistic', label: 'Realistic' },
];

function Slider({ label, value, min, max, step, unit, onChange }) {
  return (
    <div className={styles.sliderRow}>
      <div className={styles.sliderLabel}>
        <span>{label}</span>
        <span className={styles.sliderValue}>{value}{unit}</span>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function AppearanceScreen({ settings, updateSetting }) {
  const previewStyle = {
    fontFamily: settings.font,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    letterSpacing: settings.letterSpacing,
    padding: `${settings.marginWidth}px`,
    backgroundColor: THEMES.find(t => t.id === settings.theme)?.bg || '#EDE8DC',
    color: THEMES.find(t => t.id === settings.theme)?.text || '#2C2416',
  };

  return (
    <div className={styles.screen}>
      <div className={`${styles.header} safe-top`}>
        <p className="aurelia-wordmark">AURELIA</p>
        <h1 className="screen-title">Appearance</h1>
      </div>

      <div className="screen-scroll" style={{ padding: '0 16px 40px' }}>
        {/* Preview */}
        <motion.div
          className={`card ${styles.preview}`}
          style={previewStyle}
          layout
        >
          She turned the page without thinking, the way one breathes, and the story carried her further from the chair, the window, the quiet street below.
        </motion.div>

        {/* Typeface */}
        <div className={styles.sectionBlock}>
          <h2 className="section-title" style={{ marginBottom: 12 }}>Typeface</h2>
          <div className="card" style={{ overflow: 'hidden' }}>
            {FONTS.map((font, i) => (
              <div key={font.id}>
                <button
                  className={`${styles.fontRow} ${settings.font === font.id ? styles.fontActive : ''}`}
                  onClick={() => updateSetting('font', font.id)}
                >
                  <span style={{ fontFamily: font.id, fontSize: 17 }}>{font.label}</span>
                  <span style={{ fontFamily: font.id, fontSize: 14, color: 'var(--text-secondary)' }}>
                    The quiet morning
                  </span>
                  {settings.font === font.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                      <path d="M5 12l5 5L20 7" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
                {i < FONTS.length - 1 && <div className="divider" />}
              </div>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className={styles.sectionBlock}>
          <h2 className="section-title" style={{ marginBottom: 12 }}>Theme</h2>
          <div className={styles.themeGrid}>
            {THEMES.map(theme => (
              <motion.button
                key={theme.id}
                className={`${styles.themeCard} ${settings.theme === theme.id ? styles.themeActive : ''}`}
                style={{
                  backgroundColor: theme.bg,
                  borderColor: settings.theme === theme.id ? 'var(--accent)' : theme.border || 'var(--border)',
                }}
                whileTap={{ scale: 0.94 }}
                onClick={() => updateSetting('theme', theme.id)}
              >
                <span style={{ fontFamily: 'Georgia', fontSize: 22, color: theme.text }}>Aa</span>
                <span style={{ fontSize: 10, color: theme.text, opacity: 0.7, marginTop: 4 }}>
                  {theme.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Text Controls */}
        <div className={styles.sectionBlock}>
          <h2 className="section-title" style={{ marginBottom: 12 }}>Text</h2>
          <div className={`card ${styles.sliderCard}`}>
            <Slider label="Font Size" value={settings.fontSize} min={14} max={28} step={1} unit="px"
              onChange={v => updateSetting('fontSize', v)} />
            <div className="divider" />
            <Slider label="Line Height" value={settings.lineHeight} min={1.2} max={2.4} step={0.05} unit=""
              onChange={v => updateSetting('lineHeight', parseFloat(v.toFixed(2)))} />
            <div className="divider" />
            <Slider label="Margin Width" value={settings.marginWidth} min={8} max={48} step={2} unit="px"
              onChange={v => updateSetting('marginWidth', v)} />
            <div className="divider" />
            <Slider label="Letter Spacing" value={settings.letterSpacing} min={-1} max={3} step={0.25} unit="px"
              onChange={v => updateSetting('letterSpacing', v)} />
          </div>
        </div>

        {/* Reading Mode */}
        <div className={styles.sectionBlock}>
          <h2 className="section-title" style={{ marginBottom: 12 }}>Reading Mode</h2>
          <div className={styles.chipGroup}>
            {READING_MODES.map(mode => (
              <motion.button
                key={mode.id}
                className={`${styles.chip} ${settings.readingMode === mode.id ? styles.chipActive : ''}`}
                whileTap={{ scale: 0.94 }}
                onClick={() => updateSetting('readingMode', mode.id)}
              >
                {mode.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Page Turning */}
        {settings.readingMode !== 'scroll' && (
          <div className={styles.sectionBlock}>
            <h2 className="section-title" style={{ marginBottom: 12 }}>Page Turning</h2>
            <div className={styles.chipGroup}>
              {PAGE_EFFECTS.map(effect => (
                <motion.button
                  key={effect.id}
                  className={`${styles.chip} ${settings.pageTurnEffect === effect.id ? styles.chipActive : ''}`}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => updateSetting('pageTurnEffect', effect.id)}
                >
                  {effect.label}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
