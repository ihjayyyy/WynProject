'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiPackage } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
// customer options will be loaded from the API in the future; remove sample data import
import { getSuppliers, createSupplier, updateSupplier, INITIAL_SUPPLIER } from '../../services/Supplier';
import { getCustomers } from '../../services/Customer';

export default function SuppliersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [initialValues, setInitialValues] = useState(INITIAL_SUPPLIER);
  const [customerOptions, setCustomerOptions] = useState([]);
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    async function load() {
      // Fetch customers for contact person dropdown
      const customerRes = await getCustomers();
      if (mounted && !customerRes.error && customerRes.data) {
        setCustomerOptions((customerRes.data || []).map(c => ({
          label: c.name || c.customerName || c.companyName || c.email || 'Unknown',
          value: c.name || c.customerName || c.companyName || c.email || 'Unknown',
        })));
      }

      if (!supplierId) {
        setInitialValues(INITIAL_SUPPLIER);
        return;
      }
      const res = await getSuppliers();
      if (!mounted) return;
      if (res.error || !res.data) {
        console.error('Failed to load suppliers', res.error);
        setInitialValues(INITIAL_SUPPLIER);
        return;
      }
      const found = (res.data || []).find((s) => String(s.id) === String(supplierId));
      if (found) {
        const mapped = {
          id: found.id,
          code: found.code || '',
          name: found.name || '',
          contactPerson: found.contactPerson || '',
          contactNumber: found.contactNumber || found.phone || '',
          address: found.address || '',
          supplierName: found.supplierName || '',
          email: found.email || '',
          vatType: found.vatType || '',
          terms: found.terms || 0,
        };
        setInitialValues(mapped);
      } else {
        setInitialValues(INITIAL_SUPPLIER);
      }
    }
    load();
    return () => { mounted = false; };
  }, [supplierId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(supplierId && initialValues && (initialValues.id || supplierId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [supplierId, isEditMode, initialValues]);

  const formTitle = useMemo(() => {
    if (!supplierId) return 'Suppliers Form';
    if (isEditMode) return 'Edit Supplier';
    return 'View Supplier';
  }, [supplierId, isEditMode]);

  const fields = [
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    // Contact Person dropdown
    { name: 'contactPerson', label: 'Contact Person', type: 'select', options: customerOptions, span: 'span2', searchable: true },
    { name: 'contactNumber', label: 'Contact Number', span: 'span2' },
    { name: 'email', label: 'Email', span: 'span2' },
    // VAT Type select
    {
      name: 'vatType',
      label: 'VAT Type',
      type: 'select',
      span: 'span2',
      options: [
        { label: 'Included', value: 'Included' },
        { label: 'Not Included', value: 'Not Included' },
        { label: 'NON-VAT', value: 'NON-VAT' },
      ],
    },
    { name: 'address', label: 'Address', span: 'span3' },
    { name: 'terms', label: 'Terms', type: 'number', span: 'span2' },
  ];
  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Supplier Details"
      icon={<FiPackage />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const payload = {
          name: values.name || '',
          code: values.code || '',
          contactPerson: values.contactPerson || '',
          contactNumber: values.contactNumber || '',
          address: values.address || '',
          supplierName: values.supplierName || '',
          email: values.email || '',
          vatType: values.vatType || '',
          terms: values.terms || 0,
        };
        if (!supplierId) {
          try {
            const result = await createSupplier(payload);
            if (result?.error) {
              toast.error('Failed to create supplier');
            } else {
              toast.success('Supplier created');
            }
            // After create, redirect to landing
            return '/suppliers';
          } catch (err) {
            console.error('Create supplier failed', err);
            toast.error('Failed to create supplier');
            return '/suppliers';
          }
        }

        try {
          const result = await updateSupplier(supplierId, payload);
          if (result?.error) toast.error('Failed to save supplier');
          else toast.success('Supplier saved');
          return '/suppliers';
        } catch (err) {
          console.error('Update supplier failed', err);
          toast.error('Failed to save supplier');
          return '/suppliers';
        }
      }}
      backPath="/suppliers"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !supplierId ? (
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
                      router.push(`/suppliers/supplierform?id=${supplierId}`);
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
