 'use client';
import React, { useCallback, useMemo } from 'react';
import EntityForm from '@/components/EntityForm/EntityForm';
import { FiTruck } from 'react-icons/fi';
import SupplierService from '@/services/supplierService';

export default function Page() {
  const supplierService = useMemo(() => new SupplierService(), []);

  const fields = [
    { name: 'Name', label: 'Supplier Name', span: 'span3' },
    { name: 'Address', label: 'Address', span: 'span3' },
    { name: 'CompanyCode', label: 'Company Code', span: 'span2' },
    { name: 'Email', label: 'Email', span: 'span3' },
    { name: 'Website', label: 'Website', span: 'span2', rightAlign: true },
    { name: 'Phone', label: 'Phone', span: 'span3' },
    { name: 'Fax', label: 'Fax', span: 'span3' },
    { name: 'TaxNumber', label: 'Tax Number', span: 'span2' },
    { name: 'ContactPerson', label: 'Contact Person', span: 'span3' },
    { name: 'ContactNumber', label: 'Contact Number', span: 'span3' },
    { name: 'Logo', label: 'Logo', span: 'span2', type: 'file', rightAlign: true },
  ];

  const handleSubmit = useCallback(async (values) => {
    // call supplier service create
    try {
      await supplierService.createCompany(values);
    } catch (err) {
      console.error('Failed to create supplier', err);
      throw err;
    }
  }, [supplierService]);

  return (
    <EntityForm
      title="Supplier Form"
      icon={<FiTruck size={18} />}
      fields={fields}
      initialValues={{
        CompanyCode: '',
        Name: '',
        Logo: '',
        Address: '',
        Phone: '',
        Fax: '',
        Email: '',
        Website: '',
        TaxNumber: '',
        ContactPerson: '',
        ContactNumber: '',
        PaymentTerms: 30,
        Status: 'ACTIVE',
        SupplierType: 'Local',
      }}
      onSubmit={handleSubmit}
      backPath="/supplier"
    />
  );
}
