"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../ui/ConfirmModal/ConfirmModal.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';

export default function ProjectScopeModal({ open, initial = {}, onCancel, onConfirm }) {
  const formatISODate = (date) => {
    if (!date) return null;
    try {
      // Accept Date or string-like inputs, normalize to YYYY-MM-DD
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  };

  const addMonths = (date, months) => {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // handle month overflow
    if (d.getDate() !== day) {
      d.setDate(0);
    }
    return d;
  };

  const buildForm = (init = {}) => {
    const today = new Date();
    const defaultStart = formatISODate(today);
    const defaultEnd = formatISODate(addMonths(today, 1));

    return {
      id: 0,
      name: '',
      code: '',
      percentage: 0,
      description: '',
      forecastedStartDate: defaultStart,
      forecastedEndDate: defaultEnd,
      actualStartDate: null,
      actualEndDate: null,
      milestoneDate: defaultEnd,
      ...init,
    };
  };

  const [form, setForm] = useState(() => buildForm(initial));

  useEffect(() => {
    setForm(buildForm(initial));
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

  const handleChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{form && form.id ? 'Edit Scope' : 'Add Scope'}</h3>
        <div className={styles.message}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Name" value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <Input label="Code" value={form.code || ''} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <Input label="Percentage" type="number" value={form.percentage ?? 0} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value === '' ? '' : Number(e.target.value) }))} />
            <Input label="Milestone Date" type="date" value={form.milestoneDate ? String(form.milestoneDate).split('T')[0] : ''} onChange={(e) => setForm((f) => ({ ...f, milestoneDate: e.target.value }))} />
            <Input label="Forecasted Start" type="date" value={form.forecastedStartDate ? String(form.forecastedStartDate).split('T')[0] : ''} onChange={(e) => setForm((f) => ({ ...f, forecastedStartDate: e.target.value }))} />
            <Input label="Forecasted End" type="date" value={form.forecastedEndDate ? String(form.forecastedEndDate).split('T')[0] : ''} onChange={(e) => setForm((f) => ({ ...f, forecastedEndDate: e.target.value }))} />
            <Input label="Actual Start" type="date" value={form.actualStartDate ? String(form.actualStartDate).split('T')[0] : ''} onChange={(e) => setForm((f) => ({ ...f, actualStartDate: e.target.value }))} />
            <Input label="Actual End" type="date" value={form.actualEndDate ? String(form.actualEndDate).split('T')[0] : ''} onChange={(e) => setForm((f) => ({ ...f, actualEndDate: e.target.value }))} />
            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="Description" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" className={styles.button} onClick={onCancel}>Cancel</Button>
          <Button variant="primary" className={styles.button} onClick={() => {
            if (!onConfirm) return;
            const payload = {
              id: Number(form.id) || 0,
              name: form.name || '',
              code: form.code || '',
              percentage: Number(form.percentage) || 0,
              description: form.description || '',
              forecastedStartDate: form.forecastedStartDate || null,
              forecastedEndDate: form.forecastedEndDate || null,
              actualStartDate: form.actualStartDate || null,
              actualEndDate: form.actualEndDate || null,
              milestoneDate: form.milestoneDate || null,
            };
            onConfirm(payload);
          }}>Save</Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') return createPortal(content, document.body);
  return null;
}
