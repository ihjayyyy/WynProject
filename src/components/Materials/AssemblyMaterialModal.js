import React, { useEffect, useState, useMemo } from 'react';
import * as Yup from 'yup';
import ItemModal from '../ItemDetails/itemModal';
import { byTypeMaterials } from '../../services/Materials';

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
        const res = await byTypeMaterials({ materialType: 'Material' });

        if (!mounted) return;

        const list = Array.isArray(res?.data) ? res.data : [];
        console.log('materials loaded:', list);
        setMaterials(list);
      } catch (err) {
        if (mounted) setMaterials([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open]);

  const fields = useMemo(() => {
    return [
      {
        name: 'materialId',
        label: 'Material',
        type: 'select',
        value: form.materialId ? String(form.materialId) : '',
        options: materials.map((m) => ({
          value: String(m.id),
          label: `${m.name || m.code || ''}`.trim(),
        })),
        validator: Yup.string().required('Material is required'),
        onChange: (item, updateField, itemFields, nextValue) => {
          const mat = materials.find((m) => String(m.id) === String(nextValue));
          if (mat) {
            updateField('materialId', String(mat.id));
            updateField('name', mat.name || '');
            updateField('code', mat.code || '');
            updateField('uom', mat.unitOfMeasure || '');
          } else {
            updateField('materialId', '');
          }
        },
      },
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        value: form.code || '',
        readonly: true,
        validator: Yup.string().required('Code is required'),
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        value: form.name || '',
        readonly: true,
        validator: Yup.string().required('Name is required'),
      },
      {
        name: 'quantity',
        label: 'Quantity',
        type: 'number',
        value: form.quantity || 0,
        validator: Yup.number().min(0).required('Quantity is required'),
      },
      {
        name: 'uom',
        label: 'UOM',
          type: 'text',
          value: (() => {
            const mat = materials.find((m) => String(m.id) === String(form.materialId));
            return mat && mat.uom ? mat.uom : '';
          })(),
          readonly: true,
          validator: Yup.string().required('UOM is required'),
      },
    ];
  }, [form, materials]);

  return (
    <ItemModal
      key={materials.length}
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