'use client';

import styles from './StatsCard.module.scss';

export default function StatsCard({ 
  number, 
  label, 
  change, 
  isPositive = true,
  className = '' 
}) {
  return (
    <div className={`${styles.statCard} ${className}`}>
      <div className={styles.statContent}>
        <span className={styles.statNumber}>{number}</span>
        <span 
          className={styles.statChange}
          data-positive={isPositive}
        >
          {change}
        </span>
      </div>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
