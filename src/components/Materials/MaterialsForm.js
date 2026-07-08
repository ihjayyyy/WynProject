'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { createMaterial, updateMaterial, getMaterial, INITIAL_MATERIAL } from '../../services/Materials';
import { getUnitsOfMeasure } from '../../services/UnitOfMeasure';
import { getRacks } from '../../services/Rack';
import { getSuppliers } from '../../services/Supplier';
import { useToast } from '../ui/Toast/Toast';

const MATERIAL_TYPE_OPTIONS = [
  { label: 'Material', value: 'Material' },
  { label: 'Other', value: 'Other' },
];

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
  const [suppliers, setSuppliers] = useState([]);

  // Holds the values that are pending submission while we wait for the user
  // to confirm they want to proceed with a selling price below purchase price.
  const [pendingSubmitValues, setPendingSubmitValues] = useState(null);
  const [showPriceWarning, setShowPriceWarning] = useState(false);

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
        setInitialValues({
          ...INITIAL_MATERIAL,
          materialType: 'Material',
          isAssembly: false,
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
          setInitialValues({
            ...res.data,
            materialType: res.data.materialType || 'Material',
            isAssembly: false,
          });
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
    { name: 'code', label: 'Code', span: 'span2', validator: Yup.string().required('Code is required') },
    { name: 'name', label: 'Name', span: 'span2', validator: Yup.string().required('Name is required') },
    {
      name: 'materialType',
      label: 'Material Type',
      type: 'select',
      options: MATERIAL_TYPE_OPTIONS,
      span: 'span2',
      validator: Yup.string().required('Material Type is required'),
    },
    {
      name: 'supplierId',
      label: 'Supplier',
      type: 'select',
      options: supplierOptions,
      span: 'span2',
      searchable: true,
      validator: Yup.mixed().required('Supplier is required'),
    },
    {
      name: 'purchasePrice',
      label: 'Purchase Price',
      type: 'number',
      span: 'span2',
      validator: Yup.number().min(0, 'Purchase price must be 0 or more'),
      // When the purchase price changes, mirror it into selling price.
      // The user can still edit selling price afterwards since this only
      // runs when purchasePrice itself changes.
      onChange: (value, values, setValues) => {
        setValues({ ...values, purchasePrice: value, sellingPrice: value });
      },
    },
    { name: 'sellingPrice', label: 'Selling Price', type: 'number', span: 'span2', validator: Yup.number().min(0, 'Selling price must be 0 or more') },
    ...(!materialId
      ? [
          { name: 'rackId', label: 'Rack', span: 'span2', type: 'select', options: rackOptions, searchable: true, validator: Yup.mixed().required('Rack is required') },
          { name: 'stockLevel', label: 'Stock Level', type: 'number', span: 'span2', validator: Yup.number().min(0, 'Stock level must be 0 or more') },
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

  // Builds the payload and actually performs the create/update call.
  const submitValues = async (values) => {
    if (!materialId) {
      const payload = {
        name: values.name,
        code: values.code,
        materialType: values.materialType || 'Material',
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
        materialType: values.materialType || 'Material',
        unitOfMeasure: values.uom || values.unitOfMeasure || '',
        purchaseUnitOfMeasure: values.defaultPurchaseUOM || values.purchaseUnitOfMeasure || '',
        purchasePrice: Number(values.purchasePrice ?? values.unitCost) || 0,
        sellingPrice: Number(values.sellingPrice) || 0,
        referenceNumber: values.referenceNumber || '0',
        stockLevel: Number(values.stockLevel) || 0,
        isAssembly: false,
        supplierId: Number(values.supplierId) || 0,
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

  // Handler for form submit. If selling price is lower than purchase price,
  // pause and ask the user to confirm before actually saving.
  const handleSubmit = async (values) => {
    const purchasePrice = Number(values.purchasePrice ?? values.unitCost) || 0;
    const sellingPrice = Number(values.sellingPrice) || 0;

    if (sellingPrice < purchasePrice) {
      setPendingSubmitValues(values);
      setShowPriceWarning(true);
      return;
    }

    await submitValues(values);
  };

  const handleConfirmLowSellingPrice = async () => {
    const values = pendingSubmitValues;
    setShowPriceWarning(false);
    setPendingSubmitValues(null);
    if (values) {
      await submitValues(values);
    }
  };

  const handleCancelLowSellingPrice = () => {
    setShowPriceWarning(false);
    setPendingSubmitValues(null);
  };

  return (
    <>
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

      {showPriceWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: '24px 28px',
              maxWidth: 420,
              width: '90%',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Selling Price Below Purchase Price</h3>
            <p style={{ marginBottom: 20, color: '#444' }}>
              The selling price you entered is lower than the purchase price. Do you still want to continue?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button variant="outlineDanger" onClick={handleCancelLowSellingPrice}>
                Cancel
              </Button>
              <Button variant="save" onClick={handleConfirmLowSellingPrice}>
                Continue Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}