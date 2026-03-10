'use client';

import React, { useMemo } from 'react';
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
  const isEditMode = mode === 'edit';

  const initialValues = useMemo(() => {
    if (!assemblyId) return initialAssemblyState;
    const selected = sampleAssemblies.find((item) => item.id === assemblyId);
    return selected || initialAssemblyState;
  }, [assemblyId]);

  const isReadOnly = useMemo(
    () => Boolean(assemblyId && !isEditMode && sampleAssemblies.some((item) => item.id === assemblyId)),
    [assemblyId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!assemblyId) return 'Assembly Settings Form';
    if (isEditMode) return 'Edit Assembly';
    return 'View Assembly';
  }, [assemblyId, isEditMode]);

  const fields = [
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'createdDate', label: 'Created Date', type: 'date' },
    { name: 'updatedBy', label: 'Updated By' },
    { name: 'updatedDate', label: 'Updated Date', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
    { name: 'uom', label: 'UOM' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiFileText />}
      fields={fields}
      initialValues={initialValues}
      backPath="/materialsSettings/assembly"
      width="100%"
      columns={2}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !assemblyId ? (
          <Button type="submit" variant="save">Create</Button>
        ) : isReadOnly ? (
          <Button variant="outlinedPrimary" onClick={() => router.push(`/materialsSettings/assembly/assemblyForm?id=${assemblyId}&mode=edit`)}>Edit</Button>
        ) : (
          <>
            <Button variant="outlineDanger" onClick={() => router.push(`/materialsSettings/assembly/assemblyForm?id=${assemblyId}`)}>Cancel</Button>
            <Button type="submit" variant="save">Save</Button>
          </>
        )
      }
    />
  );
}
