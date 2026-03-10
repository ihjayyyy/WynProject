'use client';

import React, { useMemo } from 'react';
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
  const isEditMode = mode === 'edit';

  const initialValues = useMemo(() => {
    if (!rackId) return initialRackState;
    const selected = sampleRacks.find((r) => r.id === rackId);
    return selected || initialRackState;
  }, [rackId]);

  const isReadOnly = useMemo(
    () => Boolean(rackId && !isEditMode && sampleRacks.some((r) => r.id === rackId)),
    [rackId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!rackId) return 'Rack Form';
    if (isEditMode) return 'Edit Rack';
    return 'View Rack';
  }, [rackId, isEditMode]);

  const warehouseOptions = sampleWarehouses.map((w) => ({ label: w.name, value: w.id }));

  const fields = [
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'createdDate', label: 'Created Date', type: 'date' },
    { name: 'updatedBy', label: 'Updated By' },
    { name: 'updatedDate', label: 'Updated Date', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
    { name: 'warehouseId', label: 'Warehouse', type: 'select', options: warehouseOptions, searchable: true },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Rack Details"
      icon={<FiLayers />}
      fields={fields}
      initialValues={initialValues}
      backPath="/storagesettings/rack"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !rackId ? (
          <Button type="submit" variant="save">
            Create
          </Button>
        ) : isReadOnly ? (
          <Button variant="outlinedPrimary" onClick={() => router.push(`/storagesettings/rack/rackform?id=${rackId}&mode=edit`)}>
            Edit
          </Button>
        ) : (
          <>
            <Button variant="outlineDanger" onClick={() => router.push(`/storagesettings/rack/rackform?id=${rackId}`)}>
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
