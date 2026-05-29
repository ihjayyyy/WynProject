'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as Yup from 'yup';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiToggleLeft } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_UOM_CONVERSION, getUOMConversions, createUOMConversion, updateUOMConversion } from '../../services/UOMConversion';
import { getUnitsOfMeasure } from '../../services/UnitOfMeasure';

export default function UOMConversionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversionId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [conversions, setConversions] = useState(null);
  const [unitOptions, setUnitOptions] = useState([]);
    // Fetch unit of measure options
    useEffect(() => {
      let mounted = true;
      (async () => {
        const res = await getUnitsOfMeasure();
        if (!mounted) return;
        if (!res.error && Array.isArray(res.data)) {
          setUnitOptions(res.data.map(u => ({ label: u.name, value: u.code, code: u.code })));
        }
      })();
      return () => { mounted = false; };
    }, []);
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
    { name: 'code', label: 'Code', span: 'span2', readOnly: true },
    {
      name: 'convertFrom',
      label: 'Convert From',
      span: 'span2',
      type: 'select',
      options: unitOptions,
      validator: Yup.mixed().required('Convert From is required'),
      onChange: (selected, values, setValues) => {
        // If convertTo is the same as convertFrom, clear convertTo
        if (selected === values.convertTo) {
          setValues({ ...values, convertFrom: selected, convertTo: '' });
        } else {
          setValues({ ...values, convertFrom: selected });
        }
      },
    },
    {
      name: 'convertTo',
      label: 'Convert To',
      span: 'span2',
      type: 'select',
      options: (unitOptions || []).filter(opt => opt.value !== initialValues.convertFrom),
      validator: Yup.mixed().required('Convert To is required'),
      onChange: (selected, values, setValues) => {
        // If convertFrom is the same as convertTo, clear convertFrom
        if (selected === values.convertFrom) {
          setValues({ ...values, convertTo: selected, convertFrom: '' });
        } else {
          setValues({ ...values, convertTo: selected });
        }
      },
    },
    { name: 'conversionFactor', label: 'Conversion Factor', span: 'span2', type: 'number', validator: Yup.number().moreThan(0, 'Conversion factor must be greater than 0').required('Conversion factor is required') },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="UOM Conversion Details"
      icon={<FiToggleLeft  />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const { code, unitOfMeasurement, convertFrom, convertTo, conversionFactor } = values || {};
        // Auto-generate the name from convertFrom and convertTo
        const name = `${convertFrom} to ${convertTo} (${convertTo} to ${convertFrom})`;
        const payload = { code, unitOfMeasurement, convertFrom, convertTo, conversionFactor, name };

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
