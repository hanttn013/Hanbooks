import styles from './SettingsScreen.module.css';
import { StorageManager } from '../../utils/StorageManager';

const THEMES = [
  { id: 'pure-white', label: 'White', bg: '#FFFFFF', text: '#1A1A1A' },
  { id: 'warm-cream', label: 'Cream', bg: '#EDE8DC', text: '#2C2416' },
  { id: 'vintage-paper', label: 'Paper', bg: '#F5EDD6', text: '#3D2B1F' },
  { id: 'sepia', label: 'Sepia', bg: '#F1E4C3', text: '#3B2F0A' },
  { id: 'dark-gray', label: 'Dark', bg: '#2A2A2A', text: '#E8E0D0' },
  { id: 'amoled-black', label: 'Black', bg: '#000000', text: '#E0D8C8' },
  { id: 'forest', label: 'Forest', bg: '#1C3329', text: '#E8F0E8' },
  { id: 'ocean', label: 'Ocean', bg: '#E8F4F8', text: '#1A3040' },
  { id: 'midnight-blue', label: 'Midnight', bg: '#1A2035', text: '#D8E0F0' },
];

const FONTS = ['Merriweather', 'EB Garamond', 'Noto Serif', 'Georgia', 'Times New Roman'];

function Slider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <label className={styles.sliderRow}>
      <span>
        <strong>{label}</strong>
        <em>{value}{unit}</em>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
    </label>
  );
}

export default function SettingsScreen({ settings, updateSetting, library }) {
  const activeTheme = THEMES.find(theme => theme.id === settings.theme) || THEMES[1];
  const stats = library?.stats || {};

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Xoa toan bo du lieu Hanbooks? Viec nay se xoa sach da import, bookmarks, lists, tien do doc va cai dat.'
    );
    if (!confirmed) return;

    try {
      await StorageManager.clearAllData();
      Object.keys(localStorage)
        .filter(key => key.startsWith('aurelia_'))
        .forEach(key => localStorage.removeItem(key));
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Khong the xoa du lieu. Hay dong va mo lai app roi thu lai.');
    }
  };

  return (
    <div className={styles.screen}>
      <header className={`${styles.header} safe-top`}>
        <p className="aurelia-wordmark">AURELIA</p>
        <h1 className="screen-title">Settings</h1>
      </header>

      <div className="screen-scroll">
        <main className={styles.content}>
          <section className={styles.group}>
            <h2>Statistics</h2>
            <div className={styles.statsPanel}>
              <div className={styles.heroStat}>
                <strong>{stats.streak || 0}</strong>
                <span>day streak</span>
              </div>
              <div className={styles.statsGrid}>
                <Stat label="Books" value={stats.totalBooks || 0} />
                <Stat label="Reading" value={stats.readingBooks || 0} />
                <Stat label="Finished" value={stats.finishedBooks || 0} />
                <Stat label="Unread" value={stats.unreadBooks || 0} />
                <Stat label="Favorites" value={stats.favoriteBooks || 0} />
                <Stat label="Lists" value={stats.totalLists || 0} />
                <Stat label="Bookmarks" value={stats.bookmarkCount || 0} />
                <Stat label="Progress" value={`${stats.averageProgress || 0}%`} />
                <Stat label="Pages" value={stats.totalPages || 0} />
                <Stat label="Storage" value={stats.totalStorageLabel || '0 MB'} />
                <Stat label="Read time" value={stats.totalReadingLabel || '0m'} />
                <Stat label="Today" value={`${stats.pagesReadToday || 0} pages`} />
              </div>
            </div>
          </section>

          <section className={styles.preview} style={{ background: activeTheme.bg, color: activeTheme.text, fontFamily: settings.font, fontSize: settings.fontSize, lineHeight: settings.lineHeight }}>
            She turned the page without thinking, and the story carried her further from the quiet street below.
          </section>

          <section className={styles.group}>
            <h2>Theme</h2>
            <div className={styles.themeGrid}>
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  className={settings.theme === theme.id ? styles.themeActive : ''}
                  style={{ background: theme.bg, color: theme.text }}
                  onClick={() => updateSetting('theme', theme.id)}
                >
                  <strong>Aa</strong>
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.group}>
            <h2>Typeface</h2>
            <div className={styles.card}>
              {FONTS.map(font => (
                <button
                  key={font}
                  className={settings.font === font ? styles.rowActive : ''}
                  onClick={() => updateSetting('font', font)}
                >
                  <span style={{ fontFamily: font }}>{font}</span>
                  <em>{settings.font === font ? 'Selected' : 'Aa'}</em>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.group}>
            <h2>Text</h2>
            <div className={styles.card}>
              <Slider label="Font size" value={settings.fontSize} min={14} max={28} unit="px" onChange={v => updateSetting('fontSize', v)} />
              <Slider label="Line height" value={settings.lineHeight} min={1.2} max={2.4} step={0.05} onChange={v => updateSetting('lineHeight', parseFloat(v.toFixed(2)))} />
              <Slider label="Margins" value={settings.marginWidth} min={8} max={48} step={2} unit="px" onChange={v => updateSetting('marginWidth', v)} />
              <Slider label="Letter spacing" value={settings.letterSpacing} min={0} max={3} step={0.25} unit="px" onChange={v => updateSetting('letterSpacing', v)} />
            </div>
          </section>

          <section className={styles.group}>
            <h2>Reading mode</h2>
            <div className={styles.segment}>
              {[
                { id: 'scroll', label: 'Scroll' },
                { id: 'classic', label: 'Pages' },
              ].map(mode => (
                <button
                  key={mode.id}
                  className={settings.readingMode === mode.id ? styles.segmentActive : ''}
                  onClick={() => updateSetting('readingMode', mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.group}>
            <h2>Library</h2>
            <div className={styles.card}>
              <div className={styles.infoRow}><span>Storage</span><em>IndexedDB</em></div>
              <div className={styles.infoRow}><span>Import format</span><em>EPUB</em></div>
              <div className={styles.infoRow}><span>Metadata</span><em>Automatic extraction</em></div>
            </div>
          </section>

          <section className={styles.group}>
            <h2>Danger zone</h2>
            <div className={styles.card}>
              <button className={styles.dangerRow} onClick={handleClearData}>
                <span>Delete all app data</span>
                <em>Reset</em>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className={styles.statBox}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
