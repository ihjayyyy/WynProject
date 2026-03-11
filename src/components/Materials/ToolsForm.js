'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiArchive } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialMaterialsState, sampleMaterials } from './materialsData';

export default function ToolsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toolId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!toolId) return { ...initialMaterialsState, materialType: 'tool' };
    const selected = sampleMaterials.find((item) => item.id === toolId);
    return selected ? { ...selected, materialType: 'tool' } : { ...initialMaterialsState, materialType: 'tool' };
  }, [toolId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(toolId && sampleMaterials.some((item) => item.id === toolId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [toolId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!toolId) return 'Tools / Equipment Form';
    if (isEditMode) return 'Edit Tool';
    return 'View Tool';
  }, [toolId, isEditMode]);

  const fields = [
    { name: 'createdBy', label: 'Created By', hidden: true },
    { name: 'createdDate', label: 'Created Date', type: 'date', hidden: true },
    { name: 'updatedBy', label: 'Updated By', hidden: true },
    { name: 'updatedDate', label: 'Updated Date', type: 'date', hidden: true },

    // Row1: Code | spacer | Name
     { name: 'code', label: 'Code', span: 'span1' },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'name', label: 'Name', span: 'span1' },

    { name: 'unitCost', label: 'Unit Cost', type: 'number', span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'uom', label: 'UOM', span: 'span1' },

    { name: 'id', label: 'Id' },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },
    { name: 'defaultPurchaseUOM', label: 'Default Purchase UOM', span: 'span1' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiArchive />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!toolId) {
          const nextNumber = (sampleMaterials || []).reduce((max, item) => {
            const num = Number(String(item.id || '').replace(/[^0-9]/g, '')) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `M${nextNumber}`;
          const newItem = { ...values, materialType: 'tool', id: newId, createdBy: 'You', createdDate: now, updatedBy: 'You', updatedDate: now };
          (sampleMaterials || []).push(newItem);
          return `/materialsSettings/tools/toolsForm?id=${newId}`;
        }
        try {
          const idx = (sampleMaterials || []).findIndex((m) => m.id === toolId);
          if (idx >= 0) {
            sampleMaterials[idx] = { ...sampleMaterials[idx], ...values, materialType: 'tool', id: toolId, updatedBy: 'You', updatedDate: now };
          }
        } catch (err) {
          console.warn('Failed to update sampleMaterials', err);
        }
        return `/materialsSettings/tools/toolsForm?id=${toolId}`;
      }}
      backPath="/materialsSettings/tools"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !toolId ? (
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
                  if (mode === 'edit') { router.push(`/materialsSettings/tools/toolsForm?id=${toolId}`); return; }
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
