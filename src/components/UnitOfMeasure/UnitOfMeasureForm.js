'use client';

import React, { useMemo, useState } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiTag } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_UNIT_OF_MEASURE, getUnitsOfMeasure, createUnitOfMeasure, updateUnitOfMeasure } from '../../services/UnitOfMeasure';

export default function UnitOfMeasureForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [units, setUnits] = useState(null);
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    if (!unitId) return;
    (async () => {
      const res = await getUnitsOfMeasure();
      if (!mounted) return;
      if (!res.error) setUnits(res.data || []);
    })();
    return () => (mounted = false);
  }, [unitId]);

  const initialValues = useMemo(() => {
    if (!unitId) return INITIAL_UNIT_OF_MEASURE;
    const selected = (units || []).find((item) => String(item.id) === String(unitId));
    return selected || INITIAL_UNIT_OF_MEASURE;
  }, [unitId, units]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(unitId && (units || []).some((item) => String(item.id) === String(unitId)));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [unitId, isEditMode, units]);

  const formTitle = useMemo(() => {
    if (!unitId) return 'Unit of Measure Form';
    if (isEditMode) return 'Edit Unit of Measure';
    return 'View Unit of Measure';
  }, [unitId, isEditMode]);

  const fields = [
    { name: 'code', label: 'Code', span: 'span2', validator: Yup.string().required('Code is required') },
    { name: 'name', label: 'Name', span: 'span2', validator: Yup.string().required('Name is required') },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Unit of Measure Details"
      icon={<FiTag />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const { name, code } = values || {};
        const payload = { name, code };

        if (!unitId) {
          const res = await createUnitOfMeasure(payload);
          if (res?.error) toast.error('Failed to create unit');
          else toast.success('Unit created');
          try { router.push('/maintainance/UOM'); } catch (err) { }
          return '/maintainance/UOM';
        }

        const res = await updateUnitOfMeasure(unitId, payload);
        if (res?.error) toast.error('Failed to save unit');
        else toast.success('Unit saved');
        try { router.push('/maintainance/UOM'); } catch (err) { }
        return '/maintainance/UOM';
      }}
      backPath="/maintainance/UOM"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !unitId ? (
          <Button type="submit" variant="save">Create</Button>
        ) : (
          <>
            {isReadOnly ? (
              canEnterEditMode ? (
                <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>Edit</Button>
              ) : null
            ) : (
              <>
                <Button
                  variant="outlineDanger"
                  onClick={() => {
                    if (mode === 'edit') {
                      router.push(`/maintainance/UOM/UOMForm?id=${unitId}`);
                      return;
                    }
                    setIsEditModeLocal(false);
                  }}>
                  Cancel
                </Button>
                <Button type="submit" variant="save">Save</Button>
              </>
            )}
          </>
        )
      }
    />
  );
}
