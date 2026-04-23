'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_UOM_CONVERSION, getUOMConversions, createUOMConversion, updateUOMConversion } from '../../services/UOMConversion';

export default function UOMConversionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversionId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [conversions, setConversions] = useState(null);
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    if (!conversionId) return;
    (async () => {
      const res = await getUOMConversions();
      if (!mounted) return;
      if (!res.error) setConversions(res.data || []);
    })();
    return () => (mounted = false);
  }, [conversionId]);

  const initialValues = useMemo(() => {
    if (!conversionId) return INITIAL_UOM_CONVERSION;
    const selected = (conversions || []).find((item) => String(item.id) === String(conversionId));
    return selected || INITIAL_UOM_CONVERSION;
  }, [conversionId, conversions]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(conversionId && (conversions || []).some((item) => String(item.id) === String(conversionId)));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [conversionId, isEditMode, conversions]);

  const formTitle = useMemo(() => {
    if (!conversionId) return 'UOM Conversion Form';
    if (isEditMode) return 'Edit UOM Conversion';
    return 'View UOM Conversion';
  }, [conversionId, isEditMode]);

  const fields = [
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'unitOfMeasurement', label: 'Unit of Measurement', span: 'span2' },
    { name: 'convertFrom', label: 'Convert From', span: 'span2' },
    { name: 'convertTo', label: 'Convert To', span: 'span2' },
    { name: 'conversionFactor', label: 'Conversion Factor', span: 'span2', type: 'number' },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="UOM Conversion Details"
      icon={<FiList />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const { code, name, unitOfMeasurement, convertFrom, convertTo, conversionFactor } = values || {};
        const payload = { code, name, unitOfMeasurement, convertFrom, convertTo, conversionFactor };

        if (!conversionId) {
          const res = await createUOMConversion(payload);
          if (res?.error) toast.error('Failed to create conversion');
          else toast.success('Conversion created');
          try { router.push('/maintainance/UOMConvertion'); } catch (err) { }
          return '/maintainance/UOMConvertion';
        }

        const res = await updateUOMConversion(conversionId, payload);
        if (res?.error) toast.error('Failed to save conversion');
        else toast.success('Conversion saved');
        try { router.push('/maintainance/UOMConvertion'); } catch (err) { }
        return '/maintainance/UOMConvertion';
      }}
      backPath="/maintainance/UOMConvertion"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !conversionId ? (
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
                      router.push(`/maintainance/UOMConvertion/UOMConversionForm?id=${conversionId}`);
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
