'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { createMaterial, updateMaterial, getMaterial, INITIAL_MATERIAL } from '../../services/Materials';
import { useToast } from '../ui/Toast/Toast';

export default function AssemblyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;
  const toast = useToast();

  const [initialValues, setInitialValues] = useState({ ...INITIAL_MATERIAL, materialType: '', isAssembly: true });
  const [exists, setExists] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!materialId) {
        setInitialValues({ ...INITIAL_MATERIAL, materialType: 'AnyType', isAssembly: true });
        setExists(false);
        return;
      }
      try {
        const res = await getMaterial(materialId);
        if (cancelled) return;
        if (res?.error || !res?.data) {
          setInitialValues({ ...INITIAL_MATERIAL, materialType: 'AnyType', isAssembly: true });
          setExists(false);
        } else {
          setInitialValues({ ...res.data, materialType: 'AnyType', isAssembly: true });
          setExists(true);
        }
      } catch (e) {
        if (!cancelled) {
          setInitialValues({ ...INITIAL_MATERIAL, materialType: 'AnyType', isAssembly: true });
          setExists(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [materialId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [exists, isEditMode]);

  const formTitle = useMemo(() => {
    if (!materialId) return 'Assembly Form';
    if (isEditMode) return 'Edit Assembly';
    return 'View Assembly';
  }, [materialId, isEditMode]);

  const fields = [
    { name: 'materialType', label: 'Type', type: 'select', options: [ { label: 'Material', value: 'Material' }, { label: 'Tools', value: 'Tools' } ], span: 'span2' },
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'unitCost', label: 'Unit Cost', type: 'number', span: 'span2' },
    { name: 'unitOfMeasure', label: 'UOM', span: 'span2' },
    { name: 'purchaseUnitOfMeasure', label: 'Default Purchase UOM', span: 'span2' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiBox />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
          if (!materialId) {
              const payload = {
                name: values.name,
                code: values.code,
                materialType: values.materialType || '',
                unitOfMeasure: values.uom || values.unitOfMeasure || '',
                purchaseUnitOfMeasure: values.defaultPurchaseUOM || values.purchaseUnitOfMeasure || '',
                unitCost: Number(values.unitCost) || 0,
                isAssembly: true,
              };
            try {
              const res = await createMaterial(payload);
              if (res?.error) {
                console.error('Create assembly failed', res.error);
                toast.error('Failed to create assembly');
                return `/materialsSettings/assembly`;
              }
              toast.success('Assembly created');
              return `/materialsSettings/assembly`;
            } catch (err) {
              console.error('Create assembly exception', err);
              toast.error('Failed to create assembly');
              return `/materialsSettings/assembly`;
            }
          }
          try {
            const payload = {
              name: values.name,
              code: values.code,
              materialType: values.materialType || '',
              unitOfMeasure: values.uom || values.unitOfMeasure || '',
              purchaseUnitOfMeasure: values.defaultPurchaseUOM || values.purchaseUnitOfMeasure || '',
              unitCost: Number(values.unitCost) || 0,
              isAssembly: true,
            };
            const res = await updateMaterial(materialId, payload);
              if (res?.error) {
                console.error('Update assembly failed', res.error);
                toast.error('Failed to save assembly');
              } else {
                toast.success('Assembly saved');
              }
            } catch (err) {
              console.error('Update assembly exception', err);
            }
            return `/materialsSettings/assembly`;
      }}
      backPath="/materialsSettings/assembly"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !materialId ? (
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
                  if (mode === 'edit') { router.push(`/materialsSettings/assembly/assemblyForm?id=${materialId}`); return; }
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
