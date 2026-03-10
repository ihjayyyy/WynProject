'use client';

import React, { useMemo } from 'react';
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
  const isEditMode = mode === 'edit';

  const initialValues = useMemo(() => {
    if (!warehouseId) return initialWarehouseState;
    const selected = sampleWarehouses.find((w) => w.id === warehouseId);
    return selected || initialWarehouseState;
  }, [warehouseId]);

  const isReadOnly = useMemo(
    () => Boolean(warehouseId && !isEditMode && sampleWarehouses.some((w) => w.id === warehouseId)),
    [warehouseId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!warehouseId) return 'Warehouse Form';
    if (isEditMode) return 'Edit Warehouse';
    return 'View Warehouse';
  }, [warehouseId, isEditMode]);

  const fields = [
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'createdDate', label: 'Created Date', type: 'date' },
    { name: 'updatedBy', label: 'Updated By' },
    { name: 'updatedDate', label: 'Updated Date', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
    { name: 'location', label: 'Location' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Warehouse Details"
      icon={<FiArchive />}
      fields={fields}
      initialValues={initialValues}
      backPath="/storagesettings/warehouse"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !warehouseId ? (
          <Button type="submit" variant="save">
            Create
          </Button>
        ) : isReadOnly ? (
          <Button
            variant="outlinedPrimary"
            onClick={() => router.push(`/storagesettings/warehouse/warehouseform?id=${warehouseId}&mode=edit`)}>
            Edit
          </Button>
        ) : (
          <>
            <Button variant="outlineDanger" onClick={() => router.push(`/storagesettings/warehouse/warehouseform?id=${warehouseId}`)}>
              Cancel
            </Button>
            <Button type="submit" variant="save">
              Save
            </Button>
          </>
        )
      }
    />
  );
}
