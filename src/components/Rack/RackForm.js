'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams} from 'next/navigation';
import { FiAlignLeft } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { getRacks, createRack, updateRack, INITIAL_RACK } from '@/services/Rack';
import { getWarehouses } from '@/services/Warehouse';
import { useEffect } from 'react';

export default function RackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rackId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const [racks, setRacks] = useState([]);
  const toast = useToast();
  const [warehouses, setWarehouses] = useState([]);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getRacks();
        if (!cancelled && !res?.error) setRacks(res.data || []);
        const res2 = await getWarehouses();
        if (!cancelled && !res2?.error) setWarehouses(res2.data || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const initialValues = useMemo(() => {
    if (!rackId) return INITIAL_RACK;
    const selected = (racks || []).find((r) => String(r.id) === String(rackId));
    return selected || INITIAL_RACK;
  }, [rackId, racks]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(rackId && (racks || []).some((r) => String(r.id) === String(rackId)));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [rackId, isEditMode, racks]);

  const formTitle = useMemo(() => {
    if (!rackId) return 'Rack Form';
    if (isEditMode) return 'Edit Rack';
    return 'View Rack';
  }, [rackId, isEditMode]);

  const warehouseOptions = (warehouses || []).map((w) => ({ label: w.name, value: w.id }));

  const fields = [
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    
    { name: 'spacer-1', type: 'spacer', span: 'span1' },
    { name: 'warehouseId', label: 'Warehouse', type: 'select', options: warehouseOptions, searchable: true, span: 'span1' },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Rack Details"
      icon={<FiAlignLeft />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        if (!rackId) {
          const res = await createRack(values);
          if (res?.error) { toast.error('Failed to create rack'); return; }
          toast.success('Rack created');
          router.push('/storagesettings/rack');
          return;
        }
        const res = await updateRack(rackId, values);
        if (res?.error) { toast.error('Failed to save rack'); return; }
        toast.success('Rack saved');
        router.push('/storagesettings/rack');
      }}
      backPath="/storagesettings/rack"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !rackId ? (
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
                  if (mode === 'edit') { router.push(`/storagesettings/rack/rackform?id=${rackId}`); return; }
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

// load racks when component mounts or rackId changes
// racks are loaded in a component-level effect above
