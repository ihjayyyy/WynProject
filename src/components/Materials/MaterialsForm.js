'use client';

import React, { useMemo } from 'react';
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
  const isEditMode = mode === 'edit';

  const initialValues = useMemo(() => {
    if (!materialId) return initialMaterialsState;
    const selected = sampleMaterials.find((item) => item.id === materialId);
    return selected || initialMaterialsState;
  }, [materialId]);

  const isReadOnly = useMemo(
    () => Boolean(materialId && !isEditMode && sampleMaterials.some((item) => item.id === materialId)),
    [materialId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!materialId) return 'Materials Settings Form';
    if (isEditMode) return 'Edit Material';
    return 'View Material';
  }, [materialId, isEditMode]);

  const fields = [
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'createdDate', label: 'Created Date', type: 'date' },
    { name: 'updatedBy', label: 'Updated By' },
    { name: 'updatedDate', label: 'Updated Date', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
    { name: 'materialType', label: 'Material Type', type: 'select', options: [{ label: 'Material', value: 'material' }, { label: 'Tool', value: 'tool' }] },
    { name: 'uom', label: 'UOM' },
    { name: 'unitCost', label: 'Unit Cost', type: 'number' },
    { name: 'defaultPurchaseUOM', label: 'Default Purchase UOM' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiBox />}
      fields={fields}
      initialValues={initialValues}
      backPath="/materialsSettings/materials"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !materialId ? (
          <Button type="submit" variant="save">Create</Button>
        ) : isReadOnly ? (
          <Button variant="outlinedPrimary" onClick={() => router.push(`/materialsSettings/materials/materialsForm?id=${materialId}&mode=edit`)}>Edit</Button>
        ) : (
          <>
            <Button variant="outlineDanger" onClick={() => router.push(`/materialsSettings/materials/materialsForm?id=${materialId}`)}>Cancel</Button>
            <Button type="submit" variant="save">Save</Button>
          </>
        )
      }
    />
  );
}
