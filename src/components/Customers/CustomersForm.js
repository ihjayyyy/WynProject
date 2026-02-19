'use client';

import React, { useMemo } from 'react';
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
  const isEditMode = mode === 'edit';

  const initialValues = useMemo(() => {
    if (!customerId) {
      return initialCustomerState;
    }

    const selectedCustomer = sampleCustomers.find((item) => item.id === customerId);
    return selectedCustomer || initialCustomerState;
  }, [customerId]);

  const isReadOnly = useMemo(
    () => Boolean(customerId && !isEditMode && sampleCustomers.some((item) => item.id === customerId)),
    [customerId, isEditMode]
  );

  const formTitle = useMemo(() => {
    if (!customerId) return 'Customers Form';
    if (isEditMode) return 'Edit Customer';
    return 'View Customer';
  }, [customerId, isEditMode]);

  const fields = [
    { name: 'id', label: 'Id' },
    { name: 'createdBy', label: 'Created By' },
    { name: 'createdDate', label: 'Created Date', type: 'date' },
    { name: 'updatedBy', label: 'Updated By' },
    { name: 'updatedDate', label: 'Updated Date', type: 'date' },
    { name: 'code', label: 'Code' },
    { name: 'name', label: 'Name' },
    { name: 'customerName', label: 'Customer Name' },
    { name: 'contactNumber', label: 'Contact Number', type: 'tel' },
    { name: 'address', label: 'Address' },
    { name: 'companyName', label: 'Company Name' },
    { name: 'email', label: 'Email', type: 'email' },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Customer Details"
      icon={<FiUsers />}
      fields={fields}
      initialValues={initialValues}
      backPath="/customers"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !customerId ? (
          <Button type="submit" variant="save">
            Create
          </Button>
        ) : isReadOnly ? (
          <Button
            variant="outlinedPrimary"
            onClick={() => router.push(`/customers/customersform?id=${customerId}&mode=edit`)}>
            Edit
          </Button>
        ) : (
          <>
            <Button
              variant="outlineDanger"
              onClick={() => router.push(`/customers/customersform?id=${customerId}`)}>
              Cancel
            </Button>
            <Button type="submit" variant="save">
              Save
            </Button>
          </>
        )
      }
    />
  );
}
