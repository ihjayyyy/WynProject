'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import EntityForm from '@/components/EntityForm/EntityForm';
import { FiCheckSquare } from 'react-icons/fi';
import { ServiceService } from '@/services/serviceService';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const serviceService = useMemo(() => new ServiceService(), []);
  const searchParams = useSearchParams();
  const id = searchParams?.get ? searchParams.get('id') : null;
  const mode = searchParams?.get ? searchParams.get('mode') : null;
  const readOnly = mode === 'view';

  const [initialValues, setInitialValues] = useState({ Name: '', Description: '', ServiceCode: '', ServiceType: '', Price: 0, Guid: undefined });

  const fields = [
    { name: 'Name', label: 'Service Name', span: 'span3' },
    { name: 'Description', label: 'Description', span: 'span3' },
    { name: 'ServiceCode', label: 'Service Code', span: 'span2' },
    { name: 'ServiceType', label: 'Service Type', span: 'span3' },
    { name: 'Price', label: 'Price', span: 'span2', type: 'number', rightAlign: true },
  ];

  useEffect(() => {
    let mounted = true;
    if (id) {
      (async () => {
        try {
          const item = await serviceService.getServiceById(id);
          if (!mounted) return;
          if (item) {
            setInitialValues({ ...item });
          }
        } catch (err) {
          console.error('Failed to load service', err);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [id, serviceService]);

  const handleSubmit = useCallback(async (values) => {
    try {
      // Ensure Price is numeric
      if (values.Price) values.Price = Number(values.Price);
      if (id) {
        // update
        const updated = await serviceService.updateService({ ...initialValues, ...values });
        console.log('Updated service:', updated);
        return updated;
      } else {
        const created = await serviceService.createService(values);
        console.log('Created service:', created);
        return created;
      }
    } catch (err) {
      console.error('Failed to save service:', err);
      throw err;
    }
  }, [id, serviceService, initialValues]);

  return (
    <EntityForm
      title="Service Form"
      icon={<FiCheckSquare size={18} />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      backPath="/service"
    />
  );
}
