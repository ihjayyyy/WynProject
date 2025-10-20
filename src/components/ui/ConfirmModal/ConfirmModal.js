"use client";
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmModal.module.scss';
import Button from '../Button/Button';

export default function ConfirmModal({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel && onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    // prevent body scrolling while modal open
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
        {title && <h3 className={styles.title}>{title}</h3>}
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
          <Button variant="primary" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );

  // Render into document.body so it's not constrained by parents
  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return null;
}
