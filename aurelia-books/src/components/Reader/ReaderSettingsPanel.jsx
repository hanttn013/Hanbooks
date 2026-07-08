// Quick settings accessible from within the reader
import { APP_THEMES } from '../../styles/designTokens';

const READING_MODES = [
  { id: 'classic', label: 'Pages' },
  { id: 'scroll', label: 'Scroll' },
];

const CHAPTER_FLOWS = [
  { id: 'continuous', label: 'Continuous' },
  { id: 'manual', label: 'Manual' },
];

const STATUS_LINES = [
  { id: 'off', label: 'Off' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'detailed', label: 'Detailed' },
];

const PAGE_EFFECTS = [
  { id: 'slide', label: 'Slide' },
  { id: 'realistic', label: '3D Page Curl' },
  { id: 'none', label: 'None' },
];

function segmentStyle(active) {
  return {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: '1.5px solid',
    borderColor: active ? 'var(--accent)' : 'var(--border)',
    background: active ? 'var(--accent)' : 'var(--bg-secondary)',
    color: active ? 'var(--accent-contrast)' : 'var(--text-secondary)',
    fontFamily: 'inherit',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

function SettingSegment({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>{label}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            style={segmentStyle(value === option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReaderSettingsPanel({ settings, updateSetting, onClose }) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ justifyContent: 'flex-end' }}
    >
      <div
        className="modal-sheet"
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

        <div style={{ padding: '0 20px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
              <span>Font Size</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{settings.fontSize}px</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => updateSetting('fontSize', Math.max(14, settings.fontSize - 1))}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >-</button>
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

          <SettingSegment
            label="Reading Mode"
            value={settings.readingMode}
            options={READING_MODES}
            onChange={value => updateSetting('readingMode', value)}
          />

          {settings.readingMode === 'scroll' && (
            <SettingSegment
              label="Chapter Flow"
              value={settings.chapterFlow || 'continuous'}
              options={CHAPTER_FLOWS}
              onChange={value => updateSetting('chapterFlow', value)}
            />
          )}

          <SettingSegment
            label="Status Line"
            value={settings.readingStatusLine || 'off'}
            options={STATUS_LINES}
            onChange={value => updateSetting('readingStatusLine', value)}
          />

          {settings.readerMode !== 'lite' && settings.readingMode !== 'scroll' && (
            <SettingSegment
              label="Page Animation"
              value={settings.pageTurnEffect}
              options={PAGE_EFFECTS}
              onChange={value => updateSetting('pageTurnEffect', value)}
            />
          )}

          <div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>Theme</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {APP_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateSetting('theme', theme.id)}
                  title={theme.label}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 10,
                    border: `2px solid ${settings.theme === theme.id ? 'var(--accent)' : 'transparent'}`,
                    background: theme.bg,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: settings.theme === theme.id ? '0 0 0 1px var(--accent)' : 'none',
                  }}
                >
                  <span style={{ fontFamily: 'Georgia', fontSize: 13, color: theme.text, fontWeight: 500 }}>Aa</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
