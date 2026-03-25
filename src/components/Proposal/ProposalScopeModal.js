"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../ui/ConfirmModal/ConfirmModal.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';

export default function ProposalScopeModal({ open, initial = '', onCancel, onConfirm }) {
  const [value, setValue] = useState(initial || '');

  useEffect(() => {
    setValue(initial || '');
  }, [initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel && onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Scope of Work</h3>
        <div className={styles.message}>
          <Input id="proposal-scope" label="Scope of Work" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter scope of work" />
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" className={styles.button} onClick={onCancel}>Cancel</Button>
          <Button variant="primary" className={styles.button} onClick={() => onConfirm && onConfirm(value)}>Save</Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') return createPortal(content, document.body);
  return null;
}
