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
};

export default function ProjectMaterialModal({ open, initial = {}, onCancel, onConfirm }) {
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

  useEffect(() => {
    let mounted = true;
    if (!open) return;
    (async () => {
      try {
        const res = await getMaterials();
        if (!mounted) return;
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
        materialType: mat.materialType || mat.materialTypeName || source.materialType,
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

  const fields = useMemo(() => [
    { name: 'id', label: 'Id', type: 'number', value: Number(calculatedForm.id) || 0, hidden: true, validator: Yup.number().notRequired() },
    { name: 'name', label: 'Name', type: 'text', value: calculatedForm.name || '', hidden: true, validator: Yup.string().notRequired() },
    { name: 'parentId', label: 'Parent Id', type: 'number', value: Number(calculatedForm.parentId) || 0, hidden: true, validator: Yup.number().notRequired() },
    {
      name: 'materialId',
      label: 'Material Name (Editable)',
      type: 'select',
      value: calculatedForm.materialId ? String(calculatedForm.materialId) : '',
      options: (materials || []).map((m) => ({ value: String(m.id), name: `${m.name || m.code || ''}`.trim() })),
      validator: Yup.string().required('Material is required'),
      onChange: (item, updateField, itemFields, nextValue) => {
        const next = applyMaterialSelect(nextValue, itemFields);
        updateField('materialId', next.materialId ? String(next.materialId) : '');
        updateField('materialType', next.materialType || '');
        updateField('uom', next.uom || '');
        updateField('unitCost', Number(next.unitCost) || 0);
        updateField('code', next.code || '');
        updateField('name', next.name || '');
      },
    },
    { name: 'code', label: 'Material Code', type: 'text', value: calculatedForm.code || '', readonly: true, validator: Yup.string().notRequired() },
    { name: 'materialType', label: 'Type', type: 'text', value: calculatedForm.materialType || '', readonly: true, validator: Yup.string().notRequired() },
    { name: 'uom', label: 'UoM', type: 'text', value: calculatedForm.uom || '', readonly: true, validator: Yup.string().notRequired() },
    { name: 'unitCost', label: 'Price', type: 'number', value: Number(calculatedForm.unitCost) || 0, readonly: true, validator: Yup.number().notRequired() },
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
    { name: 'materialCost', label: 'Material Cost', type: 'number', value: Number(calculatedForm.materialCost) || 0, readonly: true, validator: Yup.number().notRequired() },
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
    { name: 'totalAmount', label: 'Total Amount', type: 'number', value: Number(calculatedForm.totalAmount) || 0, readonly: true, validator: Yup.number().notRequired() },
    { name: 'margin', label: 'Margin', type: 'number', value: Number(calculatedForm.margin) || 0, hidden: true, validator: Yup.number().notRequired() },
    { name: 'extendedCost', label: 'Extended Cost', type: 'number', value: Number(calculatedForm.extendedCost) || 0, hidden: true, validator: Yup.number().notRequired() },
    { name: 'isAssembly', label: 'Is Assembly', type: 'checkbox', value: Boolean(calculatedForm.isAssembly), hidden: true, validator: Yup.boolean().notRequired() },
    { name: 'totalPrice', label: 'Total Price', type: 'number', value: Number(calculatedForm.totalPrice) || 0, hidden: true, validator: Yup.number().notRequired() },
    { name: 'forecastedStartDate', label: 'Forecasted Start', type: 'date', value: calculatedForm.forecastedStartDate || '', hidden: true, validator: Yup.string().notRequired() },
    { name: 'forecastedEndDate', label: 'Forecasted End', type: 'date', value: calculatedForm.forecastedEndDate || '', hidden: true, validator: Yup.string().notRequired() },
    { name: 'scopeOfWork', label: 'Scope Of Work', type: 'text', value: calculatedForm.scopeOfWork || '', hidden: true, validator: Yup.string().notRequired() },
    { name: 'remarks', label: 'Remarks', type: 'text', value: calculatedForm.remarks || '', hidden: true, validator: Yup.string().notRequired() },
  ], [calculatedForm, materials, applyMaterialSelect]);

  return (
    <ItemModal
      headerLabel={initial && initial.id ? 'Edit Material' : 'Add Material'}
      mode="new"
      itemIndex={-1}
      isOpen={open}
      fields={fields}
      onItemRemove={() => {}}
      onClose={(val) => {
        if (!val) {
          onCancel && onCancel();
          return;
        }
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
          forecastedStartDate: val.forecastedStartDate || null,
          forecastedEndDate: val.forecastedEndDate || null,
          scopeOfWork: val.scopeOfWork || '',
          remarks: '',
        };
        onConfirm && onConfirm(payload);
      }}
    />
  );
}
