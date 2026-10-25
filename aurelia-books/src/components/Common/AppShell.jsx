import { useEffect, useRef } from 'react';
import styles from './AppShell.module.css';
import { useI18n } from '../../i18n/context';

const NAV_TABS = [
  {
    id: 'home',
    labelKey: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5L12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H4.5A1.5 1.5 0 0 1 3 19.5z" />
      </svg>
    ),
  },
  {
    id: 'library',
    labelKey: 'Library',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 6h8" />
        <path d="M8 10h5" />
      </svg>
    ),
  },
  {
    id: 'lists',
    labelKey: 'Lists',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5" />
        <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5" />
        <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'settings',
    labelKey: 'Settings',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.2' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AppShell({
  activeTab,
  onTabChange,
  children,
}) {
  const { t } = useI18n();
  const rootRef = useRef(null);
  const mobileNavRef = useRef(null);

  // Dynamically measure bottom nav height using ResizeObserver (never hardcode)
  useEffect(() => {
    const updateNavHeight = () => {
      const nav = mobileNavRef.current;
      const root = rootRef.current;
      if (!nav) return;

      const style = window.getComputedStyle(nav);
      const isVisible = style.display !== 'none' && nav.offsetHeight > 0;
      const height = isVisible ? nav.offsetHeight : 0;

      const px = `${height}px`;
      if (root) {
        root.style.setProperty('--app-nav-height', px);
      }
      document.documentElement.style.setProperty('--app-nav-height', px);
    };

    updateNavHeight();

    let observer = null;
    if (typeof ResizeObserver !== 'undefined' && mobileNavRef.current) {
      observer = new ResizeObserver(() => {
        updateNavHeight();
      });
      observer.observe(mobileNavRef.current);
      if (rootRef.current) {
        observer.observe(rootRef.current);
      }
    }

    window.addEventListener('resize', updateNavHeight);
    window.addEventListener('orientationchange', updateNavHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateNavHeight);
      window.removeEventListener('orientationchange', updateNavHeight);
    };
  }, []);

  return (
    <div className={styles.shellRoot} id="app-shell" ref={rootRef}>
      {/* 1. Desktop Sidebar (>= 1200px) */}
      <aside className={styles.desktopSidebar}>
        <div className={styles.brandLogo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          ShanBooks
        </div>

        <nav aria-label={t('Primary navigation')}>
          <ul className={styles.sidebarNavList}>
            {NAV_TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    data-tab={tab.id}
                    className={`${styles.navItem} ${active ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    aria-current={active ? 'page' : undefined}
                    aria-label={t(tab.labelKey)}
                  >
                    {tab.icon(active)}
                    <span>{t(tab.labelKey)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* 2. Tablet & Landscape Rail (600px - 1200px OR height < 480px) */}
      <aside className={styles.navRail}>
        <div className={styles.railLogo}>S</div>
        <nav aria-label={t('Primary navigation')}>
          <ul className={styles.railNavList}>
            {NAV_TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    data-tab={tab.id}
                    className={`${styles.railItem} ${active ? styles.active : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    aria-current={active ? 'page' : undefined}
                    aria-label={t(tab.labelKey)}
                    title={t(tab.labelKey)}
                  >
                    {tab.icon(active)}
                    <span className={styles.railLabel}>{t(tab.labelKey)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* 3. Main Content Area with Container Queries */}
      <main className={styles.mainContainer} id="app-content" tabIndex={-1}>
        {children}
      </main>

      {/* 4. Mobile Bottom TabBar (< 600px and height >= 480px) */}
      <nav className={styles.mobileTabBar} ref={mobileNavRef} aria-label={t('Primary navigation')}>
        {NAV_TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-tab={tab.id}
              className={`${styles.mobileTabItem} ${active ? styles.active : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-current={active ? 'page' : undefined}
              aria-label={t(tab.labelKey)}
            >
              {tab.icon(active)}
              <span className={styles.mobileTabLabel}>{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
