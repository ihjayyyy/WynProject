'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiPackage } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
// customer options will be loaded from the API in the future; remove sample data import
import { getSuppliers, createSupplier, updateSupplier, INITIAL_SUPPLIER } from '../../services/Supplier';

export default function SuppliersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [initialValues, setInitialValues] = useState(INITIAL_SUPPLIER);

  useEffect(() => {
    let mounted = true;
    async function load() {
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
          customerName: found.customerName || found.customer || '',
          contactNumber: found.contactNumber || found.phone || '',
          address: found.address || '',
          companyName: found.companyName || found.company || '',
          email: found.email || '',
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
    { name: 'companyName', label: 'Company', span: 'span2' },
    { name: 'customerName', label: 'Customer Name', span: 'span2' },
    { name: 'contactNumber', label: 'Contact Number', span: 'span2' },
    { name: 'email', label: 'Email', span: 'span2' },
    { name: 'address', label: 'Address', span: 'span3' },
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
          customerName: values.customerName || values.CustomerNameId || '',
          contactNumber: values.contactNumber || '',
          address: values.address || '',
          companyName: values.companyName || '',
          email: values.email || '',
        };
        if (!supplierId) {
          try {
            const result = await createSupplier(payload);
            if (result.error) throw new Error(result.error);
            let created = null;
            if (result.data) {
              if (Array.isArray(result.data.value) && result.data.value.length > 0) created = result.data.value[0];
              else if (result.data.value && typeof result.data.value === 'object') created = result.data.value;
              else created = result.data;
            }
            // After create, redirect to landing
            return '/suppliers';
          } catch (err) {
            console.error('Create supplier failed', err);
            return '/suppliers';
          }
        }

        try {
          const result = await updateSupplier(supplierId, payload);
          if (result.error) throw new Error(result.error);
          return '/suppliers';
        } catch (err) {
          console.error('Update supplier failed', err);
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
