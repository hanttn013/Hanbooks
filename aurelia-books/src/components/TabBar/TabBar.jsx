// src/components/TabBar/TabBar.jsx
import styles from './TabBar.module.css';

const TABS = [
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
    id: 'continue',
    label: 'Continue',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.5" fill="none" rx="2"/>
        <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill={active ? 'none' : 'none'}/>
        <path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M3 3h18v18H3z" fill="none"/>
        <path d="M6 3.5h12a2 2 0 012 2v13a2 2 0 01-2 2H6a2 2 0 01-2-2v-13a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0}/>
        <path d="M8 9h8M8 13h5" stroke={active ? 'var(--accent)' : 'currentColor'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill={active ? 'none' : 'none'}/>
        <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="10" cy="15" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
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
