 'use client';

import React, { useCallback } from 'react';
import EntityForm from '@/components/EntityForm/EntityForm';
import { FiCheckSquare } from 'react-icons/fi';
import { ServiceService } from '@/services/serviceService';

export default function Page() {
  const serviceService = new ServiceService();

  const fields = [
    { name: 'Name', label: 'Service Name', span: 'span3' },
    { name: 'Description', label: 'Description', span: 'span3' },
    { name: 'ServiceCode', label: 'Service Code', span: 'span2' },
    { name: 'ServiceType', label: 'Service Type', span: 'span3' },
    { name: 'Price', label: 'Price', span: 'span2', type: 'number', rightAlign: true },
  ];

  const handleSubmit = useCallback(async (values) => {
    // The mock ServiceService currently doesn't implement create; if it did,
    // you'd call it here. We'll just log for now.
    console.log('Service create payload:', values);
    // Example: await serviceService.createService(values);
  }, []);

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
