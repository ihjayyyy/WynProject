'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialMaterialsState, sampleMaterials } from './materialsData';

export default function MaterialsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!materialId) return initialMaterialsState;
    const selected = sampleMaterials.find((item) => item.id === materialId);
    return selected || initialMaterialsState;
  }, [materialId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(materialId && sampleMaterials.some((item) => item.id === materialId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [materialId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!materialId) return 'Materials Settings Form';
    if (isEditMode) return 'Edit Material';
    return 'View Material';
  }, [materialId, isEditMode]);

  const fields = [
    { name: 'createdBy', label: 'Created By', hidden: true },
    { name: 'createdDate', label: 'Created Date', type: 'date', hidden: true },
    { name: 'updatedBy', label: 'Updated By', hidden: true },
    { name: 'updatedDate', label: 'Updated Date', type: 'date', hidden: true },

    // Row1: Code | spacer | Name
    { name: 'code', label: 'Code', span: 'span1' },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'name', label: 'Name', span: 'span1' },

    // Row2: Material Type | spacer | UOM
    { name: 'materialType', label: 'Material Type', type: 'select', options: [{ label: 'Material', value: 'material' }, { label: 'Tool', value: 'tool' }], span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'uom', label: 'UOM', span: 'span1' },

    // Row3: Unit Cost | spacer | Default Purchase UOM
    { name: 'unitCost', label: 'Unit Cost', type: 'number', span: 'span1' },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'defaultPurchaseUOM', label: 'Default Purchase UOM', span: 'span1' },

    // id last
    { name: 'id', label: 'Id' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiBox />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!materialId) {
          const nextNumber = (sampleMaterials || []).reduce((max, item) => {
            const num = Number(String(item.id || '').replace(/[^0-9]/g, '')) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `M${nextNumber}`;
          const newItem = { ...values, id: newId, createdBy: 'You', createdDate: now, updatedBy: 'You', updatedDate: now };
          (sampleMaterials || []).push(newItem);
          return `/materialsSettings/materials/materialsForm?id=${newId}`;
        }
        try {
          const idx = (sampleMaterials || []).findIndex((m) => m.id === materialId);
          if (idx >= 0) {
            sampleMaterials[idx] = { ...sampleMaterials[idx], ...values, id: materialId, updatedBy: 'You', updatedDate: now };
          }
        } catch (err) {
          console.warn('Failed to update sampleMaterials', err);
        }
        return `/materialsSettings/materials/materialsForm?id=${materialId}`;
      }}
      backPath="/materialsSettings/materials"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !materialId ? (
          <Button type="submit" variant="save">Create</Button>
        ) : (
          <>
            {isReadOnly ? (
              canEnterEditMode ? (
                <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>Edit</Button>
              ) : null
            ) : (
              <>
                <Button variant="outlineDanger" onClick={() => {
                  if (mode === 'edit') { router.push(`/materialsSettings/materials/materialsForm?id=${materialId}`); return; }
                  setIsEditModeLocal(false);
                }}>Cancel</Button>
                <Button type="submit" variant="save">Save</Button>
              </>
            )}
          </>
        )
      }
    />
  );
}
