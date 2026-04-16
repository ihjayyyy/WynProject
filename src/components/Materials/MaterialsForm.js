'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { createMaterial, updateMaterial, getMaterial, INITIAL_MATERIAL } from '../../services/Materials';
import { useToast } from '../ui/Toast/Toast';

export default function MaterialsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;
  const toast = useToast();

  const [initialValues, setInitialValues] = useState({ ...INITIAL_MATERIAL, materialType: 'Material', isAssembly: false });
  const [exists, setExists] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!materialId) {
        setInitialValues({ ...INITIAL_MATERIAL, materialType: 'Material', isAssembly: false });
        setExists(false);
        return;
      }
      try {
        const res = await getMaterial(materialId);
        if (cancelled) return;
        if (res?.error || !res?.data) {
          setInitialValues({ ...INITIAL_MATERIAL, materialType: 'Material', isAssembly: false });
          setExists(false);
        } else {
          setInitialValues({ ...res.data, materialType: 'Material', isAssembly: false });
          setExists(true);
        }
      } catch (e) {
        if (!cancelled) {
          setInitialValues({ ...INITIAL_MATERIAL, materialType: 'Material', isAssembly: false });
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
    if (!materialId) return 'Materials Form';
    if (isEditMode) return 'Edit Material';
    return 'View Material';
  }, [materialId, isEditMode]);

  const fields = [
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', span: 'span2' },
    { name: 'sellingPrice', label: 'Selling Price', type: 'number', span: 'span2' },
    { name: 'referenceNumber', label: 'Reference Number', span: 'span2' },
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
          if (!materialId) {
              const payload = {
                name: values.name,
                code: values.code,
                materialType: 'Material',
                unitOfMeasure: values.uom || values.unitOfMeasure || '',
                purchaseUnitOfMeasure: values.defaultPurchaseUOM || values.purchaseUnitOfMeasure || '',
                purchasePrice: Number(values.purchasePrice ?? values.unitCost) || 0,
                sellingPrice: Number(values.sellingPrice) || 0,
                referenceNumber: values.referenceNumber || '0',
                isAssembly: false,
              };
            try {
              const res = await createMaterial(payload);
              if (res?.error) {
                console.error('Create material failed', res.error);
                toast.error('Failed to create material');
                return `/materialsSettings/materials`;
              }
              toast.success('Material created');
              return `/materialsSettings/materials`;
            } catch (err) {
              console.error('Create material exception', err);
              toast.error('Failed to create material');
              return `/materialsSettings/materials`;
            }
          }
          try {
            const payload = {
              name: values.name,
              code: values.code,
              materialType: 'Material',
              unitOfMeasure: values.uom || values.unitOfMeasure || '',
              purchaseUnitOfMeasure: values.defaultPurchaseUOM || values.purchaseUnitOfMeasure || '',
              purchasePrice: Number(values.purchasePrice ?? values.unitCost) || 0,
              sellingPrice: Number(values.sellingPrice) || 0,
              referenceNumber: values.referenceNumber || '0',
              isAssembly: false,
            };
            const res = await updateMaterial(materialId, payload);
              if (res?.error) {
                console.error('Update material failed', res.error);
                toast.error('Failed to save material');
              } else {
                toast.success('Material saved');
              }
            } catch (err) {
              console.error('Update material exception', err);
            }
            return `/materialsSettings/materials`;
      }}
      backPath="/materialsSettings/materials"
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
                  if (mode === 'edit') { router.push(`/materialsSettings/materials/materialsForm?id=${materialId}`); return; }
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
