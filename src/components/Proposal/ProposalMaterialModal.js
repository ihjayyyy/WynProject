"use client";
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ProposalMaterialModal.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';
import { getMaterials } from '../../services/Materials';

export default function ProposalMaterialModal({ open, initial = {}, onCancel, onConfirm }) {
  const [form, setForm] = useState({
    id: 0,
    name: '',
    code: '',
    parentId: 0,
    materialId: 0,
    materialType: '',
    uom: '',
    unitCost: 0,
    quantity: 0,
    vat: 0,
    materialCost: 0,
    margin: 0,
    discount: 0,
    laborCost: 0,
    extendedCost: 0,
    totalAmount: 0,
    isAssembly: true,
    totalPrice: 0,
    forecastedStartDate: null,
    forecastedEndDate: null,
    scopeOfWork: '',
    remarks: '',
    ...initial,
  });

  useEffect(() => {
    setForm({
      id: 0,
      name: '',
      code: '',
      parentId: 0,
      materialId: 0,
      materialType: '',
      uom: '',
      unitCost: 0,
      quantity: 0,
      vat: 0,
      materialCost: 0,
      margin: 0,
      discount: 0,
      laborCost: 0,
      extendedCost: 0,
      totalAmount: 0,
      isAssembly: true,
      totalPrice: 0,
      forecastedStartDate: null,
      forecastedEndDate: null,
      scopeOfWork: '',
      remarks: '',
      ...initial,
    });
  }, [initial]);

  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    let mounted = true;
    if (!open) return;
    (async () => {
      try {
        const res = await getMaterials();
        if (!mounted) return;
        if (!res.error && Array.isArray(res.data)) {
          setMaterials(res.data || []);
        } else {
          setMaterials([]);
        }
      } catch (err) {
        setMaterials([]);
      }
    })();
    return () => { mounted = false; };
  }, [open]);

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
  // compute derived fields when unitCost/quantity/laborCost change
  useEffect(() => {
    const uc = Number(form.unitCost) || 0;
    const qty = Number(form.quantity) || 0;
    const lab = Number(form.laborCost) || 0;
    const disc = Number(form.discount) || 0;
    const base = uc * qty;
    const materialBase = base - disc;
    const rawVat = materialBase * 0.12;
    const vatAmount = Number.isFinite(rawVat) ? Math.max(0, Number(rawVat.toFixed(2))) : 0;
    const materialCost = Number((materialBase + vatAmount).toFixed(2));
    const totalPrice = Number((materialCost + lab).toFixed(2));
    setForm((f) => ({ ...f, materialCost, totalPrice, totalAmount: totalPrice, extendedCost: totalPrice, vat: vatAmount }));
  }, [form.unitCost, form.quantity, form.laborCost, form.discount]);

  if (!open) return null;

  const handleChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleMaterialSelect = (val) => {
    const id = Number(val) || 0;
    const mat = (materials || []).find((m) => Number(m.id) === Number(id));
    if (mat) {
      setForm((f) => ({
        ...f,
        materialId: Number(mat.id) || 0,
        materialType: mat.materialType || mat.materialTypeName || f.materialType,
        uom: mat.unitOfMeasure || mat.uom || f.uom,
        unitCost: Number(mat.sellingPrice ?? mat.unitCost ?? mat.unitPrice ?? f.unitCost) || 0,
        code: mat.code || f.code || '',
        name: mat.name || f.name || '',
      }));
    } else {
      setForm((f) => ({ ...f, materialId: 0 }));
    }
  };

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={`${styles.panel} ${styles.widePanel}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{initial && initial.id ? 'Edit Material' : 'Add Material'}</h3>
        <div className={styles.message}>
          <div className={styles.formGrid}>
            <div className={styles.colSpan2}>
              <label htmlFor="material-select" className={styles.materialLabel}>Material Name</label>
              <Select
                id="material-select"
                value={form.materialId || 0}
                 onChange={(e) => handleMaterialSelect(e.target.value)}
                 disabled={false}
                options={(materials || []).map((m) => ({ value: m.id, label: `${m.name || m.code || ''}`.trim() }))}
                placeholder="Select material"
                searchable={true}
                className={styles.materialSelect}
              />
            </div>
            <Input id="material-code" label="Material Code" placeholder="Code" value={form.code} onChange={handleChange('code')} readOnly={true} />
              <Input id="material-type" label="Type" placeholder="Type" value={form.materialType} readOnly={true} />
            <div className={styles.inlineRow}>
                <Input id="material-uom" label="UoM" placeholder="UoM" value={form.uom} readOnly={true} />
                <Input id="material-unitCost" label="Price" type="number" placeholder="Price" value={form.unitCost} readOnly={true} />
                <Input id="material-quantity" label="Quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange('quantity')} />
                <Input id="material-discount" label="Discount" type="number" placeholder="Discount" value={form.discount} onChange={handleChange('discount')} />
                <Input id="material-vat" label="VAT" type="number" placeholder="VAT" value={form.vat} readOnly={true} />
                <Input id="material-materialCost" label="Material Cost" type="number" placeholder="Material Cost" value={form.materialCost} readOnly={true} />
                <Input id="material-totalAmount" label="Total Amount" type="number" placeholder="Total Amount" value={form.totalAmount} readOnly={true} />
            </div>
            <Input id="material-laborCost" label="Labor Cost" type="number" placeholder="Labor Cost" value={form.laborCost} onChange={handleChange('laborCost')} />
            <Input id="material-totalAmount" label="Total Amount" type="number" placeholder="Total Amount" value={form.totalAmount} readOnly={true} />
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
              parentId: Number(form.parentId) || 0,
              materialId: Number(form.materialId) || 0,
              materialType: form.materialType || '',
              uom: form.uom || '',
              unitCost: Number(form.unitCost) || 0,
              quantity: Number(form.quantity) || 0,
              vat: Number(form.vat) || 0,
              materialCost: Number(form.materialCost) || 0,
              margin: Number(form.margin) || 0,
              discount: Number(form.discount) || 0,
              laborCost: Number(form.laborCost) || 0,
              extendedCost: Number(form.extendedCost) || 0,
              totalAmount: Number(form.totalAmount) || 0,
              isAssembly: Boolean(form.isAssembly),
              totalPrice: Number(form.totalPrice) || 0,
              forecastedStartDate: form.forecastedStartDate || null,
              forecastedEndDate: form.forecastedEndDate || null,
              scopeOfWork: form.scopeOfWork || '',
              remarks: '',
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
