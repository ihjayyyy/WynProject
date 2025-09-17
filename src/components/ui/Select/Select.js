import React from 'react';
import styles from './Select.module.scss';

export default function Select({ id, value, onChange, options, className, ...props }) {
  return (
    <div className={styles.selectWrapper + (className ? ` ${className}` : '')}>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={styles.customSelect}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className={styles.selectArrow}>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}
