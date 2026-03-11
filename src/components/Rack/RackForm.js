'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiLayers } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialRackState, sampleRacks } from './rackData';
import { sampleWarehouses } from '../Warehouse/warehouseData';

export default function RackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rackId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!rackId) return initialRackState;
    const selected = sampleRacks.find((r) => r.id === rackId);
    return selected || initialRackState;
  }, [rackId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(rackId && sampleRacks.some((r) => r.id === rackId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [rackId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!rackId) return 'Rack Form';
    if (isEditMode) return 'Edit Rack';
    return 'View Rack';
  }, [rackId, isEditMode]);

  const warehouseOptions = sampleWarehouses.map((w) => ({ label: w.name, value: w.id }));

  const fields = [
    { name: 'createdBy', label: 'Created By', hidden: true },
    { name: 'createdDate', label: 'Created Date', type: 'date', hidden: true },
    { name: 'updatedBy', label: 'Updated By', hidden: true },
    { name: 'updatedDate', label: 'Updated Date', type: 'date', hidden: true },

    // Row 1: Code | spacer | Name
    { name: 'code', label: 'Code', span: 'span1' },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'name', label: 'Name', span: 'span1' },

    // Row 2: Warehouse select on left
    { name: 'warehouseId', label: 'Warehouse', type: 'select', options: warehouseOptions, searchable: true, span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'spacer-3', type: 'spacer', span: 'span1' },

    // id last so it doesn't affect header layout
    { name: 'id', label: 'Id' },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Rack Details"
      icon={<FiLayers />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!rackId) {
          const nextNumber = (sampleRacks || []).reduce((max, item) => {
            const num = Number(String(item.id || '').replace(/[^0-9]/g, '')) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `R${nextNumber}`;
          const newItem = { ...values, id: newId, createdBy: 'You', createdDate: now, updatedBy: 'You', updatedDate: now };
          (sampleRacks || []).push(newItem);
          return `/storagesettings/rack/rackform?id=${newId}`;
        }
        const idx = (sampleRacks || []).findIndex((r) => r.id === rackId);
        const updatedItem = { ...values, id: rackId, updatedBy: 'You', updatedDate: now };
        if (idx !== -1) sampleRacks[idx] = updatedItem;
        return `/storagesettings/rack/rackform?id=${rackId}`;
      }}
      backPath="/storagesettings/rack"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !rackId ? (
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
                  if (mode === 'edit') { router.push(`/storagesettings/rack/rackform?id=${rackId}`); return; }
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
