"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ScopeModal.module.scss';
import Button from '../../ui/Button/Button';
import Select from '../../ui/Select/Select';
import Input from '../../ui/Input/Input';

export default function ScopeModal({ open, onCancel, onConfirm }) {
  const [template, setTemplate] = useState('none');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel && onCancel();
      }
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

  const handleConfirm = () => {
    onConfirm && onConfirm({ template, name });
  };

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>New Scope of Work</h3>

        <div className={styles.field}>
          <label className={styles.label}>Scope Template</label>
          <Select
            id="scope-template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            options={[{ value: 'none', label: 'None' }]}
            placeholder="Select template"
            className={styles.select}
          />
        </div>

        <div className={styles.field}>
          <Input
            id="scope-name"
            label="Scope Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter scope name"
          />
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" className={styles.button} onClick={onCancel}>Cancel</Button>
          <Button variant="primary" className={styles.button} onClick={handleConfirm}>Create</Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return null;
}
