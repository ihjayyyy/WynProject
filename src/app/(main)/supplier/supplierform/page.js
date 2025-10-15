 'use client';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import EntityForm from '@/components/EntityForm/EntityForm';
import { FiTruck } from 'react-icons/fi';
import SupplierService from '@/services/supplierService';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const supplierService = useMemo(() => new SupplierService(), []);
  const searchParams = useSearchParams();
  const id = searchParams?.get ? searchParams.get('id') : null;
  const mode = searchParams?.get ? searchParams.get('mode') : null;
  const readOnly = mode === 'view';

  const [initialValues, setInitialValues] = useState({
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
    CompanyGuid: undefined,
  });

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

  useEffect(() => {
    let mounted = true;
    if (id) {
      (async () => {
        try {
          const item = await supplierService.getSupplierById(id);
          if (!mounted) return;
          if (item) setInitialValues({ ...item });
        } catch (err) {
          console.error('Failed to load supplier', err);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [id, supplierService]);

  const handleSubmit = useCallback(async (values) => {
    try {
      if (id) {
        await supplierService.updateCompany({ ...initialValues, ...values });
      } else {
        await supplierService.createCompany(values);
      }
    } catch (err) {
      console.error('Failed to save supplier', err);
      throw err;
    }
  }, [supplierService, id, initialValues]);

  return (
    <EntityForm
      title="Supplier Form"
      icon={<FiTruck size={18} />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      backPath="/supplier"
    />
  );
}
