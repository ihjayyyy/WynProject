"use client";
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmModal.module.scss';
import Button from '../Button/Button';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
  children,
  wide = false,
}) {
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

  const panelClassName = wide ? `${styles.panel} ${styles.widePanel}` : styles.panel;

  // Defensive coercion: confirmText/cancelText/title/message must be
  // renderable React children (string, number, or valid element).
  // Guards against React error #31 ("objects are not valid as a React
  // child") if a caller accidentally passes an object (e.g. an options
  // object like { successMsg } meant for a different function signature).
  const safeChild = (val, fallback) => {
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (React.isValidElement(val)) return val;
    return fallback;
  };

  const safeConfirmText = safeChild(confirmText, 'Confirm');
  const safeCancelText = safeChild(cancelText, 'Cancel');
  const safeTitle = safeChild(title, '');
  const safeMessage = safeChild(message, '');

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={panelClassName} onClick={(e) => e.stopPropagation()}>
        {safeTitle ? <h3 className={styles.title}>{safeTitle}</h3> : null}
        {safeMessage ? <p className={styles.message}>{safeMessage}</p> : null}
        {children}
        <div className={styles.actions}>
          <Button variant="secondary" className={styles.button} onClick={onCancel}>
            {safeCancelText}
          </Button>
          <Button variant={confirmVariant} className={styles.button} onClick={onConfirm}>
            {safeConfirmText}
          </Button>
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