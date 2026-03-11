'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiUsers } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialCustomerState, sampleCustomers } from './customersData';

export default function CustomersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!customerId) {
      return initialCustomerState;
    }

    const selectedCustomer = sampleCustomers.find((item) => item.id === customerId);
    return selectedCustomer || initialCustomerState;
  }, [customerId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(customerId && sampleCustomers.some((item) => item.id === customerId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [customerId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!customerId) return 'Customers Form';
    if (isEditMode) return 'Edit Customer';
    return 'View Customer';
  }, [customerId, isEditMode]);

  const fields = [
    { name: 'id', label: 'Id' },
    { name: 'code', label: 'Code', span: 'span1' },
    { name: 'name', label: 'Name', span: 'span1' },

    { name: 'customerName', label: 'Customer Name', span: 'span1' },
    { name: 'contactNumber', label: 'Contact Number', type: 'tel', span: 'span1' },

    { name: 'email', label: 'Email', type: 'email', span: 'span1' },
    { name: 'companyName', label: 'Company Name', span: 'span1' },

    // Address on its own full row
    { name: 'address', label: 'Address', span: 'span3', multiline: true, rows: 3 },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Customer Details"
      icon={<FiUsers />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        // Create
        if (!customerId) {
          const nextNumber = (sampleCustomers || []).reduce((max, item) => {
            const parts = (item.id || '').split('-');
            const num = Number(parts[1]) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newId = `CUST-${String(nextNumber).padStart(4, '0')}`;
          const newItem = {
            ...values,
            id: newId,
            createdBy: 'You',
            createdDate: now,
            updatedBy: 'You',
            updatedDate: now,
          };
          sampleCustomers.push(newItem);
          return '/customers';
        }

        // Update
        const idx = (sampleCustomers || []).findIndex((i) => i.id === customerId);
        const updatedItem = {
          ...values,
          id: customerId,
          updatedBy: 'You',
          updatedDate: now,
        };
        if (idx !== -1) sampleCustomers[idx] = updatedItem;
        return '/customers';
      }}
      backPath="/customers"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !customerId ? (
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
                      router.push(`/customers/customersform?id=${customerId}`);
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
