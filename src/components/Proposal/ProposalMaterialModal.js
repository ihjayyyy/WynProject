"use client";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';
import ItemModal from '../ItemDetails/itemModal';
import { getMaterials } from '../../services/Materials';

const DEFAULT_FORM = {
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
  laborPercentage: 0,
};

export default function ProposalMaterialModal({ open, initial = {}, onCancel, onConfirm, keepOpenOnSave = false }) {
  const [resetKey, setResetKey] = useState(0);
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...initial,
  });

  useEffect(() => {
    setForm({
      ...DEFAULT_FORM,
      ...initial,
    });
  }, [initial]);

  const [materials, setMaterials] = useState([]);

  const [materialCategory, setMaterialCategory] = useState(() => {
    const t = initial?.materialType || '';
    return ['Tools', 'Materials', 'Service'].includes(t) ? t : '';
  });

  useEffect(() => {
    const t = initial?.materialType || '';
    setMaterialCategory(['Tools', 'Materials', 'Service'].includes(t) ? t : '');
  }, [initial]);

  useEffect(() => {
    let mounted = true;
    if (!open) return;
    (async () => {
      try {
        const res = await getMaterials();
        if (!mounted) return;
        console.log('Loaded materials:', res.data); // Debug log
        if (!res.error && Array.isArray(res.data)) setMaterials(res.data || []);
        else setMaterials([]);
      } catch (err) {
        setMaterials([]);
      }
    })();
    return () => { mounted = false; };
  }, [open]);


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

  const applyMaterialSelect = useCallback((val, sourceFields = null) => {
    const id = Number(val) || 0;
    const mat = (materials || []).find((m) => Number(m.id) === Number(id));
    const source = sourceFields ? sourceFields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {}) : form;
    if (mat) {
      return {
        ...source,
        materialId: Number(mat.id) || 0,
        materialType: source.materialType,
        uom: mat.unitOfMeasure || mat.uom || source.uom,
        unitCost: Number(mat.sellingPrice ?? mat.unitCost ?? mat.unitPrice ?? source.unitCost) || 0,
        code: mat.code || source.code || '',
        name: mat.name || source.name || '',
      };
    }
    return { ...source, materialId: 0 };
  }, [form, materials]);

  const calculatedForm = useMemo(() => {
    const selected = applyMaterialSelect(form.materialId);
    const uc = Number(selected.unitCost) || 0;
    const qty = Number(selected.quantity) || 0;
    const lab = Number(selected.laborCost) || 0;
    const disc = Number(selected.discount) || 0;
    const base = uc * qty;
    const materialBase = base - disc;
    const rawVat = materialBase * 0.12;
    const vatAmount = Number.isFinite(rawVat) ? Math.max(0, Number(rawVat.toFixed(2))) : 0;
    const materialCost = Number((materialBase + vatAmount).toFixed(2));
    const totalPrice = Number((materialCost + lab).toFixed(2));
    return {
      ...selected,
      vat: vatAmount,
      materialCost,
      totalAmount: totalPrice,
      extendedCost: totalPrice,
      totalPrice,
    };
  }, [form, applyMaterialSelect]);

  const fields = useMemo(() => {
    const isService = materialCategory === 'Service';
    const categorySelected = materialCategory === 'Tools' || materialCategory === 'Materials' || materialCategory === 'Service';

    const filteredMaterials = materialCategory === 'Tools'
      ? materials.filter((m) => (m.materialType || '').toLowerCase().includes('tool'))
      : materialCategory === 'Materials'
      ? materials.filter((m) => (m.materialType || '').toLowerCase().includes('material'))
      : materials;

    return [
    { name: 'id', label: 'Id', type: 'number', value: Number(calculatedForm.id) || 0, hidden: true, validator: Yup.number().notRequired() },
    { name: 'parentId', label: 'Parent Id', type: 'number', value: Number(calculatedForm.parentId) || 0, hidden: true, validator: Yup.number().notRequired() },
    {
      name: 'materialCategory',
      label: 'Item Type',
      type: 'select',
      value: materialCategory,
      options: [
        { value: 'Tools', label: 'Tools' },
        { value: 'Materials', label: 'Materials' },
        { value: 'Service', label: 'Service' },
      ],
      validator: Yup.string().required('Material Type is required'),
      onChange: (item, updateField, itemFields, nextValue) => {
        const isNextService = nextValue === 'Service';
        setMaterialCategory(nextValue);
        setForm((f) => ({
          ...f,
          materialId: 0,
          name: '',
          code: isNextService ? 'SRVC' : '',
          uom: isNextService ? 'lot' : '',
          unitCost: 0,
          quantity: isNextService ? 1 : 0,
          materialType: nextValue,
        }));
        updateField('materialId', '');
        updateField('name', '');
        updateField('code', isNextService ? 'SRVC' : '');
        updateField('uom', isNextService ? 'lot' : '');
        updateField('unitCost', 0);
        updateField('quantity', isNextService ? 1 : 0);
        updateField('materialType', nextValue);
      },
    },
    {
      name: 'name',
      label: 'Service Name',
      type: 'text',
      value: calculatedForm.name || '',
      hidden: !isService,
      validator: isService ? Yup.string().required('Service Name is required') : Yup.string().notRequired(),
    },
    {
      name: 'materialId',
      label: 'Material Name',
      type: 'select',
      hidden: isService || !categorySelected,
      value: calculatedForm.materialId ? String(calculatedForm.materialId) : '',
      options: filteredMaterials.length === 0
        ? [{ value: '__loading__', label: 'Loading materials...' }]
        : filteredMaterials
            .filter((m) => m && m.id != null && m.id !== '')
            .map((m) => ({ value: String(m.id), label: `${m.name || m.code || ''}`.trim() })),
      validator: !isService && categorySelected ? Yup.string().required('Material is required') : Yup.string().notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const next = applyMaterialSelect(nextValue, itemFields);
        updateField('materialId', next.materialId ? String(next.materialId) : '');
        updateField('uom', next.uom || '');
        updateField('unitCost', Number(next.unitCost) || 0);
        updateField('code', next.code || '');
        updateField('name', next.name || '');
      },
    },
    { name: 'code', label: 'Material Code', type: 'text', value: calculatedForm.code || '', readonly: true, validator: Yup.string().notRequired() },
    { name: 'materialType', label: 'Type', type: 'text', value: calculatedForm.materialType || '', hidden: true, validator: Yup.string().notRequired() },
    { name: 'uom', label: 'UoM', type: 'text', value: calculatedForm.uom || '', readonly: true, validator: Yup.string().notRequired() },
    {
      name: 'unitCost',
      label: 'Price (Editable)',
      type: 'number',
      value: Number(calculatedForm.unitCost) || 0,
      validator: Yup.number().min(0).notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const uc = Number(nextValue) || 0;
        const qty = Number(itemFields.find((f) => f.name === 'quantity')?.value) || 0;
        const lab = Number(itemFields.find((f) => f.name === 'laborCost')?.value) || 0;
        const disc = Number(itemFields.find((f) => f.name === 'discount')?.value) || 0;
        const base = uc * qty;
        const materialBase = base - disc;
        const vat = Number.isFinite(materialBase * 0.12) ? Math.max(0, Number((materialBase * 0.12).toFixed(2))) : 0;
        const materialCost = Number((materialBase + vat).toFixed(2));
        const total = Number((materialCost + lab).toFixed(2));
        updateField('vat', vat);
        updateField('materialCost', materialCost);
        updateField('totalAmount', total);
        updateField('extendedCost', total);
        updateField('totalPrice', total);
      },
    },
    {
      name: 'quantity',
      label: 'Quantity (Editable)',
      type: 'number',
      value: Number(calculatedForm.quantity) || 0,
      validator: Yup.number().min(0).notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const uc = Number(itemFields.find((f) => f.name === 'unitCost')?.value) || 0;
        const lab = Number(itemFields.find((f) => f.name === 'laborCost')?.value) || 0;
        const disc = Number(itemFields.find((f) => f.name === 'discount')?.value) || 0;
        const qty = Number(nextValue) || 0;
        const base = uc * qty;
        const materialBase = base - disc;
        const vat = Number.isFinite(materialBase * 0.12) ? Math.max(0, Number((materialBase * 0.12).toFixed(2))) : 0;
        const materialCost = Number((materialBase + vat).toFixed(2));
        const total = Number((materialCost + lab).toFixed(2));
        updateField('vat', vat);
        updateField('materialCost', materialCost);
        updateField('totalAmount', total);
        updateField('extendedCost', total);
        updateField('totalPrice', total);
      },
    },
    {
      name: 'discount',
      label: 'Discount (Editable)',
      type: 'number',
      value: Number(calculatedForm.discount) || 0,
      validator: Yup.number().min(0).notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const uc = Number(itemFields.find((f) => f.name === 'unitCost')?.value) || 0;
        const lab = Number(itemFields.find((f) => f.name === 'laborCost')?.value) || 0;
        const qty = Number(itemFields.find((f) => f.name === 'quantity')?.value) || 0;
        const disc = Number(nextValue) || 0;
        const base = uc * qty;
        const materialBase = base - disc;
        const vat = Number.isFinite(materialBase * 0.12) ? Math.max(0, Number((materialBase * 0.12).toFixed(2))) : 0;
        const materialCost = Number((materialBase + vat).toFixed(2));
        const total = Number((materialCost + lab).toFixed(2));
        updateField('vat', vat);
        updateField('materialCost', materialCost);
        updateField('totalAmount', total);
        updateField('extendedCost', total);
        updateField('totalPrice', total);
      },
    },
    { name: 'vat', label: 'VAT', type: 'number', value: Number(calculatedForm.vat) || 0, readonly: true, validator: Yup.number().notRequired() },
    { name: 'materialCost', label: isService ? 'Service Amount' : 'Material Amount', type: 'number', value: Number(calculatedForm.materialCost) || 0, readonly: true, validator: Yup.number().notRequired() },
    {
      name: 'laborCost',
      label: 'Labor Cost (Editable)',
      type: 'number',
      value: Number(calculatedForm.laborCost) || 0,
      validator: Yup.number().min(0).notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const matCost = Number(itemFields.find((f) => f.name === 'materialCost')?.value) || 0;
        const lab = Number(nextValue) || 0;
        const total = Number((matCost + lab).toFixed(2));
        updateField('totalAmount', total);
        updateField('extendedCost', total);
        updateField('totalPrice', total);
      },
    },
    { name: 'totalAmount', label: 'Total Amount', type: 'number', value: Number(calculatedForm.totalAmount) || 0, readonly: true, validator: Yup.number().notRequired()},
    { name: 'margin', label: 'Margin', type: 'number', value: Number(calculatedForm.margin) || 0, hidden: true, validator: Yup.number().notRequired() },
    { name: 'extendedCost', label: 'Extended Cost', type: 'number', value: Number(calculatedForm.extendedCost) || 0, hidden: true, validator: Yup.number().notRequired() },
    { name: 'isAssembly', label: 'Is Assembly', type: 'checkbox', value: Boolean(calculatedForm.isAssembly), hidden: true, validator: Yup.boolean().notRequired() },
    { name: 'totalPrice', label: 'Total Price', type: 'number', value: Number(calculatedForm.totalPrice) || 0, hidden: true, validator: Yup.number().notRequired() },
    { name: 'forecastedStartDate', label: 'Forecasted Start', type: 'date', value: calculatedForm.forecastedStartDate || '', hidden: true, validator: Yup.string().notRequired() },
    { name: 'forecastedEndDate', label: 'Forecasted End', type: 'date', value: calculatedForm.forecastedEndDate || '', hidden: true, validator: Yup.string().notRequired() },
    { name: 'scopeOfWork', label: 'Scope Of Work', type: 'text', value: calculatedForm.scopeOfWork || '', hidden: true, validator: Yup.string().notRequired() },
    { name: 'remarks', label: 'Remarks', type: 'text', value: calculatedForm.remarks || '', hidden: true, validator: Yup.string().notRequired() },
    {
      name: 'laborPercentage',
      label: 'Labor Percentage (%)',
      type: 'number',
      value: Number(calculatedForm.laborPercentage) || 0,
      validator: Yup.number().min(0).max(100).notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const pct = Number(nextValue) || 0;
        const matCost = Number(itemFields.find((f) => f.name === 'materialCost')?.value) || 0;
        const lab = Number((matCost * pct / 100).toFixed(2));
        const total = Number((matCost + lab).toFixed(2));
        updateField('laborCost', lab);
        updateField('totalAmount', total);
        updateField('extendedCost', total);
        updateField('totalPrice', total);
      },
      // hidden: true,
    },
  ];
  }, [calculatedForm, materials, applyMaterialSelect, materialCategory]);

  const isEditMode = Boolean(initial && initial.id);

  return (
    <ItemModal
      key={resetKey}
      headerLabel={isEditMode ? 'Edit Item' : 'Add Item'}
      mode="new"
      itemIndex={-1}
      isOpen={open}
      fields={fields}
      onItemRemove={() => {}}
      confirmOnClose
      onClose={(val) => {
        if (!val) {
          onCancel && onCancel();
          return;
        }

        // Ensure forecastedStartDate and forecastedEndDate are always ISO string and not null
        const getIsoDate = (d) => {
          if (d && d.trim()) {
            // If already ISO with time, use as is; if only date, add time
            if (/T/.test(d)) return d;
            return new Date(d).toISOString();
          }
          return new Date().toISOString();
        };
        const payload = {
          id: Number(val.id) || 0,
          name: val.name || '',
          code: val.code || '',
          parentId: Number(val.parentId) || 0,
          materialId: Number(val.materialId) || 0,
          materialType: val.materialType || '',
          uom: val.uom || '',
          unitCost: Number(val.unitCost) || 0,
          quantity: Number(val.quantity) || 0,
          vat: Number(val.vat) || 0,
          materialCost: Number(val.materialCost) || 0,
          margin: Number(val.margin) || 0,
          discount: Number(val.discount) || 0,
          laborCost: Number(val.laborCost) || 0,
          extendedCost: Number(val.extendedCost) || 0,
          totalAmount: Number(val.totalAmount) || 0,
          isAssembly: Boolean(val.isAssembly),
          totalPrice: Number(val.totalPrice) || 0,
          forecastedStartDate: getIsoDate(val.forecastedStartDate),
          forecastedEndDate: getIsoDate(val.forecastedEndDate),
          scopeOfWork: val.scopeOfWork || '',
          remarks: '',
          laborPercentage: Number(val.laborPercentage) || 0,
        };
        const shouldKeepOpen = keepOpenOnSave && !isEditMode;
        onConfirm && onConfirm(payload, { closeModal: !shouldKeepOpen });

        // Always reset form after save
        setForm({
          ...DEFAULT_FORM,
          parentId: Number(payload.parentId) || 0,
          scopeOfWork: payload.scopeOfWork || '',
        });
        setResetKey((k) => k + 1);
      }}
    />
  );
}
