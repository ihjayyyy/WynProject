'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiArchive } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialWarehouseState, sampleWarehouses } from './warehouseData';

export default function WarehouseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!warehouseId) return initialWarehouseState;
    const selected = sampleWarehouses.find((w) => w.id === warehouseId);
    return selected || initialWarehouseState;
  }, [warehouseId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(warehouseId && sampleWarehouses.some((w) => w.id === warehouseId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [warehouseId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!warehouseId) return 'Warehouse Form';
    if (isEditMode) return 'Edit Warehouse';
    return 'View Warehouse';
  }, [warehouseId, isEditMode]);

  const fields = [
    { name: 'createdBy', label: 'Created By', hidden: true },
    { name: 'createdDate', label: 'Created Date', type: 'date', hidden: true },
    { name: 'updatedBy', label: 'Updated By', hidden: true },
    { name: 'updatedDate', label: 'Updated Date', type: 'date', hidden: true },

    // Row 1: Code | spacer | Name
    { name: 'code', label: 'Code', span: 'span1' },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'name', label: 'Name', span: 'span1' },

    // Row 2: Location | spacer | Quantity
    { name: 'location', label: 'Location', span: 'span1' },
    { name: 'spacer-2', type: 'spacer', span: 'span1' },
    { name: 'quantity', label: 'Quantity', type: 'number', span: 'span1' },

    // id last
    { name: 'id', label: 'Id' },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Warehouse Details"
      icon={<FiArchive />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!warehouseId) {
          const nextNumber = (sampleWarehouses || []).reduce((max, item) => {
            const num = Number(String(item.id || '').replace(/[^0-9]/g, '')) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `W${nextNumber}`;
          const newItem = { ...values, id: newId, createdBy: 'You', createdDate: now, updatedBy: 'You', updatedDate: now };
          (sampleWarehouses || []).push(newItem);
          return `/storagesettings/warehouse/warehouseform?id=${newId}`;
        }
        try {
          const idx = (sampleWarehouses || []).findIndex((w) => w.id === warehouseId);
          if (idx >= 0) {
            sampleWarehouses[idx] = { ...sampleWarehouses[idx], ...values, id: warehouseId, updatedBy: 'You', updatedDate: now };
          }
        } catch (err) {
          console.warn('Failed to update sampleWarehouses', err);
        }
        return `/storagesettings/warehouse/warehouseform?id=${warehouseId}`;
      }}
      backPath="/storagesettings/warehouse"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !warehouseId ? (
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
                  if (mode === 'edit') { router.push(`/storagesettings/warehouse/warehouseform?id=${warehouseId}`); return; }
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
