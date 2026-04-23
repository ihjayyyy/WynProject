
import React, { useEffect, useState, useMemo } from 'react';
import * as Yup from 'yup';
import ItemModal from '../ItemDetails/itemModal';
import { getMaterials } from '../../services/Materials';

const DEFAULT_FORM = {
  name: '',
  code: '',
  parentMaterialId: 0,
  materialId: 0,
  quantity: 0,
  uom: '',
};

export default function AssemblyMaterialModal({ open, initial = {}, onCancel, onConfirm }) {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initial });
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    setForm({ ...DEFAULT_FORM, ...initial });
  }, [initial]);

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

  const fields = useMemo(() => [
    {
      name: 'materialId',
      label: 'Material',
      type: 'select',
      value: form.materialId ? String(form.materialId) : '',
      options: (materials || []).map((m) => ({ value: String(m.id), name: `${m.name || m.code || ''}`.trim() })),
      validator: Yup.string().required('Material is required'),
      onChange: (item, updateField, itemFields, nextValue) => {
        const mat = (materials || []).find((m) => String(m.id) === String(nextValue));
        if (mat) {
          updateField('materialId', String(mat.id));
          updateField('name', mat.name || '');
          updateField('code', mat.code || '');
        } else {
          updateField('materialId', '');
        }
      },
    },
    { name: 'name', label: 'Name', type: 'text', value: form.name || '', readonly: true, validator: Yup.string().required('Name is required') },
    { name: 'code', label: 'Code', type: 'text', value: form.code || '', readonly: true, validator: Yup.string().required('Code is required') },
    { name: 'quantity', label: 'Quantity', type: 'number', value: form.quantity || 0, validator: Yup.number().min(0).required('Quantity is required') },
    { name: 'uom', label: 'UOM', type: 'number', value: form.uom !== undefined && form.uom !== '' ? parseFloat(form.uom) : '', readonly: false, validator: Yup.number().required('UOM is required') },
  ], [form, materials]);

  return (
    <ItemModal
      headerLabel={form.materialId ? 'Edit Material' : 'Add Material'}
      mode={form.materialId ? 'edit' : 'new'}
      itemIndex={-1}
      isOpen={open}
      fields={fields}
      onItemRemove={() => {}}
      onClose={(val) => {
        if (!val) {
          onCancel && onCancel();
          return;
        }
        // parentMaterialId should be 0 if creating
        const isCreate = !initial || !initial.materialId;
        onConfirm && onConfirm({
          ...form,
          ...val,
          parentMaterialId: isCreate ? 0 : (initial.parentMaterialId || 0),
          ...(initial && initial.id ? { id: initial.id } : {}),
        });
      }}
    />
  );
}
