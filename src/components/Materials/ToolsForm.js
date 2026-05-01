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
    const [uomOptions, setUomOptions] = useState([]);
    // Load UOM options
    useEffect(() => {
      let mounted = true;
      (async () => {
        const { getUnitsOfMeasure } = await import('../../services/UnitOfMeasure');
        const res = await getUnitsOfMeasure();
        if (mounted && res.data) {
          setUomOptions((res.data || []).map(uom => ({
            label: uom.name || uom.code,
            value: uom.name || uom.code,
          })));
        }
      })();
      return () => { mounted = false; };
    }, []);
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
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', span: 'span2' },
    { name: 'sellingPrice', label: 'Selling Price', type: 'number', span: 'span2' },
    { name: 'referenceNumber', label: 'Reference Number', span: 'span2' },
    { name: 'unitOfMeasure', label: 'UOM', type: 'select', options: uomOptions, span: 'span2' },
    { name: 'purchaseUnitOfMeasure', label: 'Default Purchase UOM', span: 'span2' },
  ];

  // Handler for form submit
  const handleSubmit = async (values) => {
    if (!toolId) {
      const payload = {
        name: values.name,
        code: values.code,
        materialType: 'Tool',
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
          console.error('Create tool failed', res.error);
          toast.error('Failed to create tool');
        } else {
          toast.success('Tool created');
          router.push('/materialsSettings/tools');
        }
      } catch (err) {
        console.error('Create tool exception', err);
        toast.error('Failed to create tool');
      }
      return;
    }
    try {
      const payload = {
        name: values.name,
        code: values.code,
        materialType: 'Tool',
        unitOfMeasure: values.uom || values.unitOfMeasure || '',
        purchaseUnitOfMeasure: values.defaultPurchaseUOM || values.purchaseUnitOfMeasure || '',
        purchasePrice: Number(values.purchasePrice ?? values.unitCost) || 0,
        sellingPrice: Number(values.sellingPrice) || 0,
        referenceNumber: values.referenceNumber || '0',
        isAssembly: false,
      };
      const res = await updateMaterial(toolId, payload);
      if (res?.error) {
        console.error('Update tool failed', res.error);
        toast.error('Failed to save tool');
      } else {
        toast.success('Tool saved');
        router.push('/materialsSettings/tools');
      }
    } catch (err) {
      console.error('Update tool exception', err);
      toast.error('Failed to save tool');
    }
  };

  return (
    <EntityForm
      title={formTitle}
      icon={<FiArchive />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
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
