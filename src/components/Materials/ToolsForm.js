'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiArchive } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { createMaterial, updateMaterial, getMaterial, INITIAL_MATERIAL } from '../../services/Materials';
import { useToast } from '../ui/Toast/Toast';

export default function ToolsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toolId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;
  const toast = useToast();

  const [initialValues, setInitialValues] = useState({ ...INITIAL_MATERIAL, materialType: 'Tool', isAssembly: false });
  const [exists, setExists] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!toolId) {
        setInitialValues({ ...INITIAL_MATERIAL, materialType: 'Tool', isAssembly: false });
        setExists(false);
        return;
      }
      try {
        const res = await getMaterial(toolId);
        if (cancelled) return;
        if (res?.error || !res?.data) {
          setInitialValues({ ...INITIAL_MATERIAL, materialType: 'Tool', isAssembly: false });
          setExists(false);
        } else {
          setInitialValues({ ...res.data, materialType: 'Tool', isAssembly: false });
          setExists(true);
        }
      } catch (e) {
        if (!cancelled) {
          setInitialValues({ ...INITIAL_MATERIAL, materialType: 'Tool', isAssembly: false });
          setExists(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [toolId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [exists, isEditMode]);

  const formTitle = useMemo(() => {
    if (!toolId) return 'Tools / Equipment Form';
    if (isEditMode) return 'Edit Tool';
    return 'View Tool';
  }, [toolId, isEditMode]);

  const fields = [
      { name: 'code', label: 'Code', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'unitCost', label: 'Unit Cost', type: 'number', span: 'span2' },
    { name: 'unitOfMeasure', label: 'UOM', span: 'span2' },
    { name: 'purchaseUnitOfMeasure', label: 'Default Purchase UOM', span: 'span2' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiArchive />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!toolId) {
          const payload = {
            name: values.name,
            code: values.code,
            materialType: 'Tool',
            unitOfMeasure: values.uom || values.unitOfMeasure || '',
            purchaseUnitOfMeasure: values.defaultPurchaseUOM || values.purchaseUnitOfMeasure || '',
            unitCost: Number(values.unitCost) || 0,
            isAssembly: false,
          };
          try {
            const res = await createMaterial(payload);
            if (res?.error) {
              console.error('Create tool failed', res.error);
              toast.error('Failed to create tool');
              return `/materialsSettings/tools`;
            }
            toast.success('Tool created');
            return `/materialsSettings/tools`;
          } catch (err) {
            console.error('Create tool exception', err);
            toast.error('Failed to create tool');
            return `/materialsSettings/tools`;
          }
        }
        try {
          const payload = {
            name: values.name,
            code: values.code,
            materialType: 'Tool',
            unitOfMeasure: values.uom || values.unitOfMeasure || '',
            purchaseUnitOfMeasure: values.defaultPurchaseUOM || values.purchaseUnitOfMeasure || '',
            unitCost: Number(values.unitCost) || 0,
            isAssembly: false,
          };
          const res = await updateMaterial(toolId, payload);
          if (res?.error) {
            console.error('Update tool failed', res.error);
            toast.error('Failed to save tool');
          } else {
            toast.success('Tool saved');
          }
        } catch (err) {
          console.error('Update tool exception', err);
        }
        return `/materialsSettings/tools`;
      }}
      backPath="/materialsSettings/tools"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !toolId ? (
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
                  if (mode === 'edit') { router.push(`/materialsSettings/tools/toolsForm?id=${toolId}`); return; }
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
