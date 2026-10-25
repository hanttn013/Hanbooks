// src/components/Common/PageHeader.jsx
import styles from './PageHeader.module.css';

export default function PageHeader({
  title,
  subtitle,
  actions,
  className = '',
}) {
  return (
    <header className={`${styles.headerContainer} ${className}`} role="banner">
      <div className={styles.topRow}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {actions && <div className={styles.actionsArea}>{actions}</div>}
      </div>
      {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
    </header>
  );
}

