'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiPackage } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialSupplierState, sampleSuppliers } from './suppliersData';
import { sampleCustomers } from '../Customers/customersData';

export default function SuppliersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supplierId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!supplierId) return initialSupplierState;
    const selected = sampleSuppliers.find((item) => item.id === supplierId);
    return selected || initialSupplierState;
  }, [supplierId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(supplierId && sampleSuppliers.some((item) => item.id === supplierId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [supplierId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!supplierId) return 'Suppliers Form';
    if (isEditMode) return 'Edit Supplier';
    return 'View Supplier';
  }, [supplierId, isEditMode]);

  const fields = [
    { name: 'id', label: 'Id', span: 'span2' },
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'spacer-1', type: 'spacer', span: 'span1' },

  ];

  const customerOptions = useMemo(() => {
    return (sampleCustomers || []).map((c) => ({ value: c.id, label: c.customerName || c.companyName || c.name || c.id }));
  }, []);

  // insert customer select field (so it appears after Name)
  fields.push({ name: 'CustomerNameId', label: 'Customer', type: 'select', options: customerOptions, searchable: true, span: 'span1' });

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Supplier Details"
      icon={<FiPackage />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        if (!supplierId) {
          const nextNumber = (sampleSuppliers || []).reduce((max, item) => {
            const parts = (item.id || '').split('-');
            const num = Number(parts[1]) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `SUP-${String(nextNumber).padStart(4, '0')}`;
          const newItem = {
            ...values,
            id: newId,
            createdBy: 'You',
            createdDate: now,
            updatedBy: 'You',
            updatedDate: now,
          };
          sampleSuppliers.push(newItem);
          return '/suppliers';
        }

        const idx = (sampleSuppliers || []).findIndex((i) => i.id === supplierId);
        const updatedItem = {
          ...values,
          id: supplierId,
          updatedBy: 'You',
          updatedDate: now,
        };
        if (idx !== -1) sampleSuppliers[idx] = updatedItem;
        return '/suppliers';
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
