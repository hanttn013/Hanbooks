// src/components/TabBar/TabBar.jsx
import styles from './TabBar.module.css';

const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 11.5L12 5l8 6.5V20a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1v-8.5z" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'library',
    label: 'Library',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="3" height="16" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        <rect x="8" y="4" width="3" height="16" rx="1" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"/>
        <path d="M14 4.5L19.5 6l-2 14-5.5-1.5L14 4.5z" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'lists',
    label: 'Lists',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="16" height="4" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"/>
        <rect x="4" y="11" width="16" height="4" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity="0.55" stroke="currentColor" strokeWidth="1.6"/>
        <rect x="4" y="17" width="16" height="3" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity="0.25" stroke="currentColor" strokeWidth="1.6"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"/>
        <path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.4 1a7.3 7.3 0 00-2-1.2L14.2 3h-4.4l-.3 2.7a7.3 7.3 0 00-2 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7.3 7.3 0 002 1.2l.3 2.7h4.4l.3-2.7a7.3 7.3 0 002-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className={styles.tabBar}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <span className={styles.icon}>{tab.icon(activeTab === tab.id)}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
