 'use client';

import React, { useCallback, useMemo } from 'react';
import EntityForm from '@/components/EntityForm/EntityForm';
import { FiCheckSquare } from 'react-icons/fi';
import { ServiceService } from '@/services/serviceService';

export default function Page() {
  const serviceService = useMemo(() => new ServiceService(), []);

  const fields = [
    { name: 'Name', label: 'Service Name', span: 'span3' },
    { name: 'Description', label: 'Description', span: 'span3' },
    { name: 'ServiceCode', label: 'Service Code', span: 'span2' },
    { name: 'ServiceType', label: 'Service Type', span: 'span3' },
    { name: 'Price', label: 'Price', span: 'span2', type: 'number', rightAlign: true },
  ];

  const handleSubmit = useCallback(async (values) => {
    try {
      // Ensure Price is numeric
      if (values.Price) values.Price = Number(values.Price);
      const created = await serviceService.createService(values);
      console.log('Created service:', created);
      return created;
    } catch (err) {
      console.error('Failed to create service:', err);
      throw err;
    }
  }, [serviceService]);

  return (
    <EntityForm
      title="Service Form"
      icon={<FiCheckSquare size={18} />}
      fields={fields}
      initialValues={{ Name: '', Description: '', ServiceCode: '', ServiceType: '', Price: 0 }}
      onSubmit={handleSubmit}
      backPath="/service"
    />
  );
}
