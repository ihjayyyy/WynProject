'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams} from 'next/navigation';
import { FiBox } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { INITIAL_MATERIAL_INVENTORY, getMaterialInventory, createMaterialInventory, updateMaterialInventory } from '../../services/MaterialInventory';
import { useToast } from '../ui/Toast/Toast';
import { byTypeMaterials as fetchByTypeMaterials } from '../../services/Materials';
import { getRacks } from '../../services/Rack';

export default function MaterialInventoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inventoryId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const [racks, setRacks] = useState([]);
  const isEditMode = mode === 'edit' || isEditModeLocal;

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

  const [initialValues, setInitialValues] = useState(INITIAL_MATERIAL_INVENTORY);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!inventoryId) {
        setInitialValues(INITIAL_MATERIAL_INVENTORY);
        return;
      }
      try {
        const res = await getMaterialInventory(inventoryId);
        const data = res?.data;
        if (!cancelled && !res?.error && data) {
          const item = Array.isArray(data) ? data[0] : data;
          setInitialValues(item || INITIAL_MATERIAL_INVENTORY);
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

  const materialOptions = useMemo(() => {
    return (materials || []).map((m) => ({ label: `${m.code ? m.code + ' - ' : ''}${m.name}`, value: m.id }));
  }, [materials]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchByTypeMaterials({ materialType: 'Material', isAssembly: false });
        if (!cancelled && !res?.error) setMaterials(res.data || []);
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, []);

  const rackOptions = useMemo(() => {
    return (racks || []).map((r) => ({ label: `${r.warehouseName ? r.warehouseName + ' - ' : ''}${r.name}`, value: r.id }));
  }, [racks]);

  const fields = [
    { name: 'materialId', label: 'Material', span: 'span1', type: 'select', options: materialOptions, searchable: true },
    { name: 'spacer-1', type: 'spacer', span: 'span2' },
    { name: 'rackId', label: 'Rack', span: 'span1', type: 'select', options: rackOptions, searchable: true },
    { name: 'spacer-2', type: 'spacer', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'quantity', label: 'Quantity', type: 'number', span: 'span2' },
    { name: 'stockLevel', label: 'Stock Level', type: 'number', span: 'span2' },
  ];

  return (
    <EntityForm
      title={formTitle}
      icon={<FiBox />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!inventoryId) {
          try {
            const payload = { name: values.name, code: values.code || '', rackId: values.rackId, materialId: values.materialId, quantity: values.quantity, stockLevel: Number(values.stockLevel ?? values.quantity) || 0 };
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
  );
}
