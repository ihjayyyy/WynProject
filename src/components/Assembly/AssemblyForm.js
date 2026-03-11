'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiFileText } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialAssemblyState, sampleAssemblies } from './assemblyData';

export default function AssemblyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assemblyId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!assemblyId) return initialAssemblyState;
    const selected = sampleAssemblies.find((item) => item.id === assemblyId);
    return selected || initialAssemblyState;
  }, [assemblyId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(assemblyId && sampleAssemblies.some((item) => item.id === assemblyId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [assemblyId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!assemblyId) return 'Assembly Settings Form';
    if (isEditMode) return 'Edit Assembly';
    return 'View Assembly';
  }, [assemblyId, isEditMode]);

  const fields = [
    { name: 'createdBy', label: 'Created By', hidden: true },
    { name: 'createdDate', label: 'Created Date', type: 'date', hidden: true },
    { name: 'updatedBy', label: 'Updated By', hidden: true },
    { name: 'updatedDate', label: 'Updated Date', type: 'date', hidden: true },

    // Row 1: Code | spacer | Name
    { name: 'code', label: 'Code', span: 'span1' },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'name', label: 'Name', span: 'span1' },

    // Row 2: UOM (left) with two empty cols
    { name: 'uom', label: 'UOM', span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },

    // place id at end so it doesn't affect top layout
    { name: 'id', label: 'Id' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiFileText />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!assemblyId) {
          const nextNumber = (sampleAssemblies || []).reduce((max, item) => {
            const num = Number(String(item.id || '').replace(/[^0-9]/g, '')) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `A${nextNumber}`;
          const newItem = { ...values, id: newId, createdBy: 'You', createdDate: now, updatedBy: 'You', updatedDate: now };
          (sampleAssemblies || []).push(newItem);
          return `/materialsSettings/assembly/assemblyForm?id=${newId}`;
        }
        const idx = (sampleAssemblies || []).findIndex((i) => i.id === assemblyId);
        const updatedItem = { ...values, id: assemblyId, updatedBy: 'You', updatedDate: now };
        if (idx !== -1) sampleAssemblies[idx] = updatedItem;
        return `/materialsSettings/assembly/assemblyForm?id=${assemblyId}`;
      }}
      backPath="/materialsSettings/assembly"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !assemblyId ? (
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
                  if (mode === 'edit') { router.push(`/materialsSettings/assembly/assemblyForm?id=${assemblyId}`); return; }
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
