'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams} from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import Input from '../ui/Input/Input';
import { INITIAL_MATERIAL_INVENTORY, getMaterialInventory, createMaterialInventory, updateMaterialInventory, updateMaterialInventoryQuantity } from '../../services/MaterialInventory';
import { useToast } from '../ui/Toast/Toast';
import { byTypeMaterials as fetchByTypeMaterials } from '../../services/Materials';
import { getRacks } from '../../services/Rack';

const MATERIAL_TYPE_OPTIONS = [
  { label: 'Material', value: 'Material' },
  { label: 'Other', value: 'Other' },
];

export default function MaterialInventoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inventoryId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const [racks, setRacks] = useState([]);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  // Drives which material type is used to fetch the Material dropdown options.
  // NOT sent in the payload.
  const [materialTypeFilter, setMaterialTypeFilter] = useState('Material');

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

  const [initialValues, setInitialValues] = useState({ ...INITIAL_MATERIAL_INVENTORY, materialType: 'Material' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!inventoryId) {
        setInitialValues({ ...INITIAL_MATERIAL_INVENTORY, materialType: 'Material' });
        setMaterialTypeFilter('Material');
        return;
      }
      try {
        const res = await getMaterialInventory(inventoryId);
        const data = res?.data;
        if (!cancelled && !res?.error && data) {
          const item = Array.isArray(data) ? data[0] : data;
          setInitialValues({ ...(item || INITIAL_MATERIAL_INVENTORY), materialType: item?.materialType || 'Material' });
          setMaterialTypeFilter(item?.materialType || 'Material');
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [inventoryId]);

  const [exists, setExists] = useState(false);
  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [exists, isEditMode]);

  useEffect(() => { setExists(Boolean(initialValues && initialValues.id)); }, [initialValues]);

  const formTitle = useMemo(() => {
    if (!inventoryId) return 'Material Inventory Form';
    if (isEditMode) return 'Edit Inventory Record';
    return 'View Inventory Record';
  }, [inventoryId, isEditMode]);

  const [materials, setMaterials] = useState([]);
  const toast = useToast();
  const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);
  const [qtyChange, setQtyChange] = useState('');
  const [qtySaving, setQtySaving] = useState(false);

  const openQuantityModal = () => {
    setQtyChange('');
    setIsQtyModalOpen(true);
  };

  const closeQuantityModal = () => {
    setIsQtyModalOpen(false);
    setQtyChange('');
  };

  const handleApplyQuantityChange = async () => {
    if (!inventoryId || qtySaving) return;
    const parsed = Number(qtyChange);
    if (!Number.isFinite(parsed) || parsed === 0) {
      toast.error('Enter a non-zero number. Use positive to add, negative to deduct.');
      return;
    }

    try {
      setQtySaving(true);
      const res = await updateMaterialInventoryQuantity(inventoryId, parsed);
      if (res?.error) throw new Error(res.error);

      const fresh = await getMaterialInventory(inventoryId);
      const freshData = fresh?.data;
      if (!fresh?.error && freshData) {
        const item = Array.isArray(freshData) ? freshData[0] : freshData;
        setInitialValues({ ...(item || INITIAL_MATERIAL_INVENTORY), materialType: item?.materialType || 'Material' });
      }

      toast.success('Quantity updated successfully.');
      closeQuantityModal();
    } catch (error) {
      toast.error('Failed to update quantity.');
    } finally {
      setQtySaving(false);
    }
  };

const materialOptions = useMemo(() => {
  return (materials || []).map((m) => ({
    label: `${m.code ? `[${m.code}] ` : ''}${m.name || ''}`.trim(),
    value: m.id,
  }));
}, [materials]);

  // Refetch materials whenever the material type filter changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchByTypeMaterials({ materialType: materialTypeFilter || 'Material', isAssembly: false });
        if (!cancelled && !res?.error) setMaterials(res.data || []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [materialTypeFilter]);

  const rackOptions = useMemo(() => {
    return (racks || []).map((r) => ({ label: `${r.warehouseName ? r.warehouseName + ' - ' : ''}${r.name}`, value: r.id }));
  }, [racks]);

  const fields = [
    {
      name: 'materialType',
      label: 'Material Type',
      type: 'select',
      options: MATERIAL_TYPE_OPTIONS,
      span: 'span1',
      onChange: (selected, values, setValues) => {
        setMaterialTypeFilter(selected);
        // Clear the previously selected material since it may not belong
        // to the newly selected material type.
        setValues({ ...values, materialType: selected, materialId: '' });
      },
    },
    { name: 'spacer-1', type: 'spacer', span: 'span2' },
    { name: 'materialId', label: 'Material', span: 'span1', type: 'select', options: materialOptions, searchable: true, validator: Yup.mixed().required('Material is required') },
    { name: 'spacer-2', type: 'spacer', span: 'span2' },
    { name: 'rackId', label: 'Rack', span: 'span1', type: 'select', options: rackOptions, searchable: true, validator: Yup.mixed().required('Rack is required') },
    { name: 'spacer-3', type: 'spacer', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2', validator: Yup.string().required('Name is required') },
    { name: 'stockLevel', label: 'Stock Level', type: 'number', span: 'span2', validator: Yup.number().min(0, 'Stock level must be 0 or more') },
  ];

  return (
    <>
    <EntityForm
      title={formTitle}
      icon={<FiBox />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!inventoryId) {
          try {
            // NOTE: materialType is intentionally excluded from the payload —
            // it's only used to filter the Material dropdown on this form.
            const payload = {
              name: values.name,
              code: values.code || '',
              rackId: values.rackId,
              materialId: values.materialId,
              quantity: values.quantity,
              stockLevel: Number(values.stockLevel ?? values.quantity) || 0,
            };
            const result = await createMaterialInventory(payload);
            if (result.error) throw new Error(result.error);
            let created = null;
            if (result.data) {
              if (Array.isArray(result.data.value) && result.data.value.length > 0) created = result.data.value[0];
              else if (result.data.value && typeof result.data.value === 'object') created = result.data.value;
              else created = result.data;
            }
            toast.success('Inventory record created');
            try { router.push('/inventory/material-inventory'); } catch (err) {}
            return '/inventory/material-inventory';
          } catch (err) {
            console.error('Create inventory failed', err);
            toast.error('Failed to create inventory record');
            try { router.push('/inventory/material-inventory'); } catch (e) {}
            return '/inventory/material-inventory';
          }
        }
        try {
          // NOTE: materialType is intentionally excluded from the payload —
          // it's only used to filter the Material dropdown on this form.
          const payload = { name: values.name, code: values.code || '', rackId: values.rackId, materialId: values.materialId, quantity: values.quantity, stockLevel: Number(values.stockLevel) || 0 };
          const result = await updateMaterialInventory(inventoryId, payload);
          if (result.error) throw new Error(result.error);
          toast.success('Inventory record updated');
          try { router.push('/inventory/material-inventory'); } catch (err) {}
          return '/inventory/material-inventory';
        } catch (err) {
          console.error('Update inventory failed', err);
          toast.error('Failed to update inventory record');
          try { router.push('/inventory/material-inventory'); } catch (e) {}
          return '/inventory/material-inventory';
        }
      }}
      backPath="/inventory/material-inventory"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !inventoryId ? (
          <Button type="submit" variant="save">Create</Button>
        ) : (
          <>
            <Button variant="outlinedPrimary" onClick={openQuantityModal} disabled={qtySaving}>Update Quantity</Button>
            {isReadOnly ? (
              canEnterEditMode ? (
                <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>Edit</Button>
              ) : null
            ) : (
              <>
                <Button variant="outlineDanger" onClick={() => {
                  if (mode === 'edit') { router.push(`/inventory/material-inventory/materialInventoryForm?id=${inventoryId}`); return; }
                  setIsEditModeLocal(false);
                }}>Cancel</Button>
                <Button type="submit" variant="save">Save</Button>
              </>
            )}
          </>
        )
      }
    />
    <ConfirmModal
      open={isQtyModalOpen}
      title="Adjust Quantity"
      message="Use positive number to add stock and negative number to deduct stock."
      confirmText={qtySaving ? 'Saving...' : 'Apply'}
      confirmVariant="primary"
      onConfirm={handleApplyQuantityChange}
      onCancel={closeQuantityModal}>
      <div style={{ marginBottom: '12px' }}>
        <Input
          type="number"
          value={qtyChange}
          onChange={(e) => setQtyChange(e.target.value)}
          placeholder="e.g. 5 or -3"
          min={-999999}
          max={999999}
          disabled={qtySaving}
        />
        {initialValues?.name ? (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
            Target: {initialValues.name}
          </div>
        ) : null}
      </div>
    </ConfirmModal>
    </>
  );
}