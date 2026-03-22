'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiArchive } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { createWarehouse, getWarehouses, updateWarehouse, INITIAL_WAREHOUSE } from '../../services/Warehouse';

export default function WarehouseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const warehouseId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [initialValuesState, setInitialValuesState] = useState(INITIAL_WAREHOUSE);
  const [loading, setLoading] = useState(false);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!warehouseId) {
        setInitialValuesState(INITIAL_WAREHOUSE);
        setExists(false);
        return;
      }
      setLoading(true);
      const res = await getWarehouses();
      setLoading(false);
      if (!mounted) return;
      if (res.error || !res.data) {
        console.error('Failed to load warehouse', res.error);
        setInitialValuesState(INITIAL_WAREHOUSE);
        setExists(false);
        return;
      }
      const found = (res.data || []).find((w) => String(w.id) === String(warehouseId));
      if (found) {
        const mapped = {
          id: found.id,
          code: found.code || '',
          name: found.name || '',
          location: found.location || found.locationName || '',
          quantity: found.quantity ?? 0,
          createdBy: found.createdBy || '',
          createdDate: found.createdAt || found.createdDate || '',
          updatedBy: found.updatedBy || '',
          updatedDate: found.updatedAt || found.updatedDate || '',
        };
        setInitialValuesState(mapped);
        setExists(true);
      } else {
        setInitialValuesState(INITIAL_WAREHOUSE);
        setExists(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [warehouseId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [exists, isEditMode]);

  const formTitle = useMemo(() => {
    if (!warehouseId) return 'Warehouse Form';
    if (isEditMode) return 'Edit Warehouse';
    return 'View Warehouse';
  }, [warehouseId, isEditMode]);

  const fields = [
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'location', label: 'Location', span: 'span2' },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Warehouse Details"
      icon={<FiArchive />}
      fields={fields}
      initialValues={initialValuesState}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!warehouseId) {
          try {
            const payload = { name: values.name, code: values.code, location: values.location };
            const result = await createWarehouse(payload);
            if (result.error) throw new Error(result.error);
            let created = null;
            if (result.data) {
              if (Array.isArray(result.data.value) && result.data.value.length > 0) created = result.data.value[0];
              else if (result.data.value && typeof result.data.value === 'object') created = result.data.value;
              else created = result.data;
            }
            if (created && (created.id || created.ID)) {
              const newId = created.id || created.ID;
              return `/storagesettings/warehouse/warehouseform?id=${newId}`;
            }
            // If API didn't return a created id, navigate back to list
            console.warn('Create returned no id, redirecting to list');
            return '/storagesettings/warehouse';
          } catch (err) {
            console.error('Create warehouse failed', err);
            return '/storagesettings/warehouse';
          }
        }
        // Update flow: call PUT /Warehouse/{id} with the reduced payload
        try {
          const payload = { name: values.name, code: values.code, location: values.location };
          const result = await updateWarehouse(warehouseId, payload);
          if (result.error) throw new Error(result.error);
          return `/storagesettings/warehouse/warehouseform?id=${warehouseId}`;
        } catch (err) {
          console.error('Update warehouse failed', err);
          return `/storagesettings/warehouse/warehouseform?id=${warehouseId}`;
        }
      }}
      backPath="/storagesettings/warehouse"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !warehouseId ? (
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
                  if (mode === 'edit') { router.push(`/storagesettings/warehouse/warehouseform?id=${warehouseId}`); return; }
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
