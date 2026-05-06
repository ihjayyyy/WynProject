'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams} from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { createMaterial, updateMaterial, getMaterial, INITIAL_MATERIAL } from '../../services/Materials';
import { getUnitsOfMeasure } from '../../services/UnitOfMeasure';
import { getRacks } from '../../services/Rack';
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
  const [uomOptions, setUomOptions] = useState([]);
  const [racks, setRacks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getRacks();
        if (!cancelled && !res?.error) setRacks(res.data || []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const rackOptions = useMemo(() => {
    return (racks || []).map((r) => ({ label: `${r.warehouseName ? r.warehouseName + ' - ' : ''}${r.name}`, value: r.id }));
  }, [racks]);

  // Load UOM options
  useEffect(() => {
    let mounted = true;
    (async () => {
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!materialId) {
        // For new material, sync both UOM fields if one is set
        setInitialValues(prev => {
          const uom = prev.unitOfMeasure || prev.purchaseUnitOfMeasure || '';
          return {
            ...INITIAL_MATERIAL,
            materialType: 'Material',
            isAssembly: false,
            unitOfMeasure: uom,
            purchaseUnitOfMeasure: uom,
          };
        });
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
    ...(!materialId
      ? [
          { name: 'rackId', label: 'Rack', span: 'span2', type: 'select', options: rackOptions, searchable: true },
          { name: 'initialQuantity', label: 'Initial Quantity', type: 'number', span: 'span2' },
        ]
      : []),
    // { name: 'referenceNumber', label: 'Reference Number', span: 'span2' },
    {
      name: 'unitOfMeasure',
      label: 'UOM',
      type: 'select',
      options: uomOptions,
      span: 'span2',
      onChange: (selected, values, setValues) => {
        setValues({
          ...values,
          unitOfMeasure: selected,
          purchaseUnitOfMeasure: selected,
        });
      },
    },
    {
      name: 'purchaseUnitOfMeasure',
      label: 'Default Purchase UOM',
      type: 'select',
      options: uomOptions,
      span: 'span2',
      onChange: (selected, values, setValues) => {
        setValues({
          ...values,
          purchaseUnitOfMeasure: selected,
          unitOfMeasure: selected,
        });
      },
    },
  ];

  // Handler for form submit
  const handleSubmit = async (values) => {
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
        rackId: Number(values.rackId) || 0,
        initialQuantity: Number(values.initialQuantity) || 0,
        isAssembly: false,
      };
      try {
        const res = await createMaterial(payload);
        if (res?.error) {
          console.error('Create material failed', res.error);
          toast.error('Failed to create material');
        } else {
          toast.success('Material created');
          router.push('/materialsSettings/materials');
        }
      } catch (err) {
        console.error('Create material exception', err);
        toast.error('Failed to create material');
      }
      return;
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
        router.push('/materialsSettings/materials');
      }
    } catch (err) {
      console.error('Update material exception', err);
      toast.error('Failed to save material');
    }
  };

  return (
    <EntityForm
      title={formTitle}
      icon={<FiBox />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
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
