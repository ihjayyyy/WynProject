'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useRouter,useSearchParams } from 'next/navigation';
import { FiArchive } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { createMaterial, updateMaterial, getMaterial, INITIAL_MATERIAL } from '../../services/Materials';
import { getRacks } from '../../services/Rack';
import { getSuppliers } from '../../services/Supplier';
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
  const [racks, setRacks] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSuppliers();
        if (!cancelled && !res?.error) setSuppliers(res.data || []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const rackOptions = useMemo(() => {
    return (racks || []).map((r) => ({ label: `${r.warehouseName ? r.warehouseName + ' - ' : ''}${r.name}`, value: r.id }));
  }, [racks]);

  const supplierOptions = useMemo(() => {
    return (suppliers || []).map((s) => ({
      label: `${s.code ? `[${s.code}] ` : ''}${s.supplierName || s.name || ''}`.trim(),
      value: s.id,
    }));
  }, [suppliers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!toolId) {
        setInitialValues({
          ...INITIAL_MATERIAL,
          materialType: 'Tool',
          isAssembly: false,
        });
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
    { name: 'code', label: 'Code', span: 'span2', validator: Yup.string().required('Code is required') },
    { name: 'name', label: 'Name', span: 'span2', validator: Yup.string().required('Name is required') },
    {
      name: 'supplierId',
      label: 'Supplier',
      type: 'select',
      options: supplierOptions,
      span: 'span2',
      searchable: true,
      validator: Yup.mixed().required('Supplier is required'),
    },
    { name: 'purchasePrice', label: 'Purchase Price', type: 'number', span: 'span2', validator: Yup.number().min(0, 'Purchase price must be 0 or more') },
    { name: 'sellingPrice', label: 'Selling Price', type: 'number', span: 'span2', validator: Yup.number().min(0, 'Selling price must be 0 or more') },
    ...(!toolId
      ? [
          { name: 'rackId', label: 'Rack', span: 'span2', type: 'select', options: rackOptions, searchable: true, validator: Yup.mixed().required('Rack is required') },
          { name: 'stockLevel', label: 'Stock Level', type: 'number', span: 'span2', validator: Yup.number().min(0, 'Stock level must be 0 or more') },
        ]
      : []),
    { name: 'referenceNumber', label: 'Reference Number', span: 'span2' },
    {
      name: 'unitOfMeasure',
      label: 'UOM',
      type: 'select',
      options: uomOptions,
      span: 'span2',
      onChange: (selected, values, setValues) => {
        setValues({ ...values, unitOfMeasure: selected, purchaseUnitOfMeasure: selected });
      },
      validator: Yup.string().required('UOM is required'),
    },
    {
      name: 'purchaseUnitOfMeasure',
      label: 'Default Purchase UOM',
      type: 'select',
      options: uomOptions,
      span: 'span2',
      validator: Yup.string().required('Default Purchase UOM is required'),
    },
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
        rackId: Number(values.rackId) || 0,
        initialQuantity: 0,
        stockLevel: Number(values.stockLevel) || 0,
        isAssembly: false,
        supplierId: Number(values.supplierId) || 0,
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
          stockLevel: Number(values.stockLevel) || 0,
        isAssembly: false,
        supplierId: Number(values.supplierId) || 0,
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