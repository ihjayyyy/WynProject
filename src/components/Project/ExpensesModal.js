"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../ui/ConfirmModal/ConfirmModal.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';

function buildFormState(initial = {}, projectId = 0) {
  return {
    id: 0,
    name: '',
    code: '',
    projectId: Number(projectId) || 0,
    scopeId: 0,
    amount: 0,
    referenceNumber: 0,
    description: '',
    ...initial,
    projectId: Number(initial.projectId) || Number(projectId) || 0,
    scopeId: Number(initial.scopeId) || 0,
    amount: Number(initial.amount) || 0,
    referenceNumber: Number(initial.referenceNumber) || 0,
    description: initial.description || initial.desciption || '',
  };
}

export default function ExpensesModal({
  open,
  initial = {},
  projectId = 0,
  scopeOptions = [],
  onCancel,
  onConfirm,
}) {
  const [form, setForm] = useState(() => buildFormState(initial, projectId));

  useEffect(() => {
    setForm(buildFormState(initial, projectId));
  }, [initial, open, projectId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === 'Escape') onCancel && onCancel();
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const setField = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()} style={{ width: 'min(560px, 100%)' }}>
        <h3 className={styles.title}>{form.id ? 'Edit Expense' : 'Add Expense'}</h3>
        <div className={styles.message}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Name" value={form.name || ''} onChange={setField('name')} />
            <Input label="Code" value={form.code || ''} onChange={setField('code')} />
            <Input
              label="Amount"
              type="number"
              step="0.01"
              value={form.amount ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            />
            <Input
              label="Reference Number"
              type="number"
              value={form.referenceNumber ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, referenceNumber: event.target.value }))}
            />
            <Input
              label="Description"
              value={form.description || ''}
              onChange={setField('description')}
            />

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>
                Scope
              </label>
              <Select
                value={String(form.scopeId || '')}
                onChange={(event) => setForm((current) => ({ ...current, scopeId: Number(event.target.value) || 0 }))}
                options={scopeOptions}
                placeholder="Select scope (optional)"
              />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!onConfirm) return;
              onConfirm({
                id: Number(form.id) || 0,
                name: form.name || '',
                code: form.code || '',
                projectId: Number(form.projectId) || Number(projectId) || 0,
                scopeId: Number(form.scopeId) || 0,
                amount: Number(form.amount) || 0,
                referenceNumber: Number(form.referenceNumber) || 0,
                description: form.description || '',
                desciption: form.description || '',
              });
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') return createPortal(content, document.body);
  return null;
}
