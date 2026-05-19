'use client';

import styles from './StatsCard.module.scss';

export default function StatsCard({ 
  number, 
  label, 
  change, 
  isPositive = true,
  className = '' 
}) {
  const formatNumber = (val) => {
    if (val === null || val === undefined) return '';
    // If already a non-empty string, return as-is
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return '';
      // If string is numeric, format it
      const n = Number(trimmed.replace(/,/g, ''));
      if (Number.isFinite(n)) {
        // integer -> no decimals, otherwise 2 decimals
        return Number.isInteger(n)
          ? n.toLocaleString()
          : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return val;
    }

    if (typeof val === 'number' && Number.isFinite(val)) {
      return Number.isInteger(val)
        ? val.toLocaleString()
        : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return String(val);
  };

  const displayNumber = formatNumber(number);

  return (
    <div className={`${styles.statCard} ${className}`}>
      <div className={styles.statContent}>
        <span className={styles.statNumber}>{displayNumber}</span>
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
