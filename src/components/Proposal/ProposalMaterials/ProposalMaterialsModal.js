"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../../ui/Button/Button';
import Select from '../../ui/Select/Select';
import Input from '../../ui/Input/Input';
import { sampleMaterialInventory } from '../../MaterialInventory/materialInventoryData';
import styles from './ProposalMaterialsModal.module.scss';

export default function ProposalMaterialsModal({ open, onCancel, onConfirm, initial, scopeName }) {
  const [materialId, setMaterialId] = useState(initial?.materialId || '');
  const [name, setName] = useState(initial?.name || '');
  const [quantity, setQuantity] = useState(initial?.quantity || '1');

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

  useEffect(() => {
    const mi = sampleMaterialInventory.find((m) => m.code === materialId || m.id === materialId);
    if (mi) {
      setName(mi.name || '');
      if (!initial) setQuantity(mi.quantity || '1');
    }
  }, [materialId]);

  if (!open) return null;

  const selected = sampleMaterialInventory.find((m) => m.code === materialId || m.id === materialId) || {};
  const unitPrice = Number(selected.unitCost || 0);
  const qty = Number(quantity || 0);
  const total = unitPrice * qty;

  const handleConfirm = () => {
    onConfirm && onConfirm({
      materialId: selected.code || selected.id || materialId,
      name,
      quantity: String(quantity),
      unitCost: String(selected.unitCost || ''),
      totalCost: String(total),
    });
  };

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Add Material</h3>
        {scopeName ? <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Scope: {scopeName}</div> : null}

        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label className={styles.label}>Select Material</label>
            <Select
              id="material-select"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              options={(sampleMaterialInventory || []).map((m) => ({ value: m.code || m.id, label: `${m.code || m.id} — ${m.name}` }))}
              placeholder="Select material"
              className={styles.select}
            />
          </div>

          <div className={styles.field}>
            <Input id="material-name" label="Material Name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className={styles.field}>
            <Input id="material-qty" label="Quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          <div className={styles.field}>
            <Input id="unit-price" label="Unit Price" value={String(selected.unitCost || '')} readOnly />
          </div>

          <div className={styles.field}>
            <Input id="total-price" label="Total" value={String(total)} readOnly />
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" className={styles.button} onClick={onCancel}>Cancel</Button>
          <Button variant="primary" className={styles.button} onClick={handleConfirm}>Add</Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return null;
}
