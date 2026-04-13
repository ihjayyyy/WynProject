"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../ui/ConfirmModal/ConfirmModal.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';

export default function ProjectStaffModal({ open, initial = {}, staffOptions = [], scopeOptions = [], onCancel, onConfirm }) {
  const buildForm = (init = {}) => ({
    id: 0,
    name: '',
    code: '',
    scopeId: 0,
    staffId: 0,
    job: '',
    ...init,
  });

  const [form, setForm] = useState(() => buildForm(initial));

  useEffect(() => {
    setForm(buildForm(initial));
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel && onCancel(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleStaffSelect = (e) => {
    const id = Number(e.target.value) || 0;
    const found = staffOptions.find((s) => Number(s.value) === id);
    setForm((f) => ({
      ...f,
      staffId: id,
      name: found ? found.name || found.label : f.name,
      code: found ? found.code || f.code : f.code,
      job: found ? found.job || f.job : f.job,
    }));
  };

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 100%)' }}>
        <h3 className={styles.title}>{form.id ? 'Edit Project Staff' : 'Add Project Staff'}</h3>
        <div className={styles.message}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Staff Member</label>
              <Select
                value={String(form.staffId || '')}
                onChange={handleStaffSelect}
                options={staffOptions}
                placeholder="Select staff"
                searchable
              />
            </div>
            <Input label="Name" value={form.name || ''} onChange={set('name')} />
            <Input label="Code" value={form.code || ''} onChange={set('code')} />
            <Input label="Job" value={form.job || ''} onChange={set('job')} />
            {scopeOptions.length > 0 && (
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Scope</label>
                <Select
                  value={String(form.scopeId || '')}
                  onChange={(e) => setForm((f) => ({ ...f, scopeId: Number(e.target.value) || 0 }))}
                  options={scopeOptions}
                  placeholder="Select scope (optional)"
                />
              </div>
            )}
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
                scopeId: Number(form.scopeId) || 0,
                staffId: Number(form.staffId) || 0,
                job: form.job || '',
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
