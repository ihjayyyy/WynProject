'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import {
  initialMaterialInventoryState,
  sampleMaterialInventory,
} from './materialInventoryData';

export default function MaterialInventoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const isEditMode = mode === 'edit';

  const initialValues = useMemo(() => {
    if (!materialId) {
      return initialMaterialInventoryState;
    }

    const selectedMaterial = sampleMaterialInventory.find((item) => item.id === materialId);
    return selectedMaterial || initialMaterialInventoryState;
  }, [materialId]);

  const isReadOnly = useMemo(
    () => Boolean(materialId && !isEditMode && sampleMaterialInventory.some((item) => item.id === materialId)),
    [materialId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!materialId) return 'Material Inventory Form';
    if (isEditMode) return 'Edit Material';
    return 'View Material';
  }, [materialId, isEditMode]);

  const fields = [
    {
      name: 'materialType',
      label: 'MaterialType',
      type: 'select',
      options: [
        { label: 'Material', value: 'material' },
        { label: 'Tool', value: 'tool' },
      ],
    },
    { name: 'uom', label: 'UOM' },
    { name: 'unitCost', label: 'UnitCost', type: 'number' },
    { name: 'quantity', label: 'Quantity', type: 'number' },
    { name: 'vat', label: 'VAT' },
    { name: 'wt', label: 'WT' },
    { name: 'totalCost', label: 'TotalCost', type: 'number' },
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'CreatedBy' },
    { name: 'createdDate', label: 'CreatedDate', type: 'date' },
    { name: 'updatedBy', label: 'UpdatedBy' },
    { name: 'updatedDate', label: 'UpdatedDate', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiBox />}
      fields={fields}
      initialValues={initialValues}
      backPath="/materialinventory"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !materialId ? (
          <Button type="submit" variant="save">
            Create
          </Button>
        ) : isReadOnly ? (
          <Button
            variant="outlinedPrimary"
            onClick={() =>
              router.push(`/materialinventory/materialinventoryform?id=${materialId}&mode=edit`)
            }>
            Edit
          </Button>
        ) : (
          <>
            <Button
              variant="outlineDanger"
              onClick={() => router.push(`/materialinventory/materialinventoryform?id=${materialId}`)}>
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
