import React from 'react';
import styles from './Input.module.scss';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  icon,
  multiline = false,
  rows = 3,
  ...props
}) {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className={styles.field}>
      {label && <label htmlFor={id}>{label}</label>}
      <div className={styles.inputIconWrap}>
        {icon && <span className={styles.inputIcon}>{icon}</span>}
        {multiline ? (
          <textarea
            className={styles.input}
            id={id}
            name={props.name}
            value={value}
            onChange={onChange}
            rows={rows}
            {...props}
          />
        ) : (
          <input
            className={styles.input}
            id={id}
            type={type}
            value={type === 'date' ? today : value}
            onChange={onChange}
            {...props}
          />
        )}
      </div>
    </div>
  );
}
