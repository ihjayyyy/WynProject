'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialMaterialInventoryState, sampleMaterialInventory } from './materialInventoryData';
import { sampleMaterials } from '../Materials/materialsData';
import { sampleRacks } from '../Rack/rackData';

export default function MaterialInventoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inventoryId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!inventoryId) return initialMaterialInventoryState;
    const selected = sampleMaterialInventory.find((item) => item.id === inventoryId);
    return selected || initialMaterialInventoryState;
  }, [inventoryId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(inventoryId && sampleMaterialInventory.some((item) => item.id === inventoryId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [inventoryId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!inventoryId) return 'Material Inventory Form';
    if (isEditMode) return 'Edit Inventory Record';
    return 'View Inventory Record';
  }, [inventoryId, isEditMode]);

  const materialOptions = useMemo(() => {
    return (sampleMaterials || [])
      .filter((m) => m.materialType === 'material')
      .map((m) => ({ label: `${m.code ? m.code + ' - ' : ''}${m.name}`, value: m.id }));
  }, []);

  const rackOptions = useMemo(() => {
    return (sampleRacks || []).map((r) => ({ label: `${r.code ? r.code + ' - ' : ''}${r.name}`, value: r.id }));
  }, []);

  const fields = [
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'quantity', label: 'Quantity', type: 'number', span: 'span2' },
    { name: 'id', label: 'Id', span: 'span2' },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'rackId', label: 'Rack', span: 'span1', type: 'select', options: rackOptions, searchable: true },
    { name: 'spacer-2', type: 'spacer', span: 'span2' },
    { name: 'materialId', label: 'Material', span: 'span1', type: 'select', options: materialOptions, searchable: true },

  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiBox />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!inventoryId) {
          const nextNumber = (sampleMaterialInventory || []).reduce((max, item) => {
            const num = Number(String(item.id || '').replace(/[^0-9]/g, '')) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `I${nextNumber}`;
          const newItem = { ...values, id: newId, createdBy: 'You', createdDate: now, updatedBy: 'You', updatedDate: now };
          (sampleMaterialInventory || []).push(newItem);
          return `/inventory/material-inventory/materialInventoryForm?id=${newId}`;
        }
        try {
          const idx = (sampleMaterialInventory || []).findIndex((m) => m.id === inventoryId);
          if (idx >= 0) {
            sampleMaterialInventory[idx] = { ...sampleMaterialInventory[idx], ...values, id: inventoryId, updatedBy: 'You', updatedDate: now };
          }
        } catch (err) {
          console.warn('Failed to update sampleMaterialInventory', err);
        }
        return `/inventory/material-inventory/materialInventoryForm?id=${inventoryId}`;
      }}
      backPath="/inventory/material-inventory"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !inventoryId ? (
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
                  if (mode === 'edit') { router.push(`/inventory/material-inventory/materialInventoryForm?id=${inventoryId}`); return; }
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
