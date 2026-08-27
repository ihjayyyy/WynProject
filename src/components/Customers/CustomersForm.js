'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiUsers } from 'react-icons/fi';
import * as Yup from 'yup';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { useToast } from '../ui/Toast/Toast';
import { INITIAL_CUSTOMER, getCustomers, createCustomer, updateCustomer } from '../../services/Customer';

export default function CustomersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const [customers, setCustomers] = useState(null);
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    if (!customerId) return;
    (async () => {
      const res = await getCustomers();
      if (!mounted) return;
      if (!res.error) setCustomers(res.data || []);
    })();
    return () => (mounted = false);
  }, [customerId]);

  const initialValues = useMemo(() => {
    if (!customerId) return INITIAL_CUSTOMER;
    const selectedCustomer = (customers || []).find((item) => String(item.id) === String(customerId));
    return selectedCustomer || INITIAL_CUSTOMER;
  }, [customerId, customers]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(customerId && (customers || []).some((item) => String(item.id) === String(customerId)));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [customerId, isEditMode, customers]);

  const formTitle = useMemo(() => {
    if (!customerId) return 'Customers Form';
    const titleText =
      (initialValues &&
        (initialValues.customerNo ||
          initialValues.code ||
          initialValues.name ||
          initialValues.customerName)) ||
      (isEditMode ? 'Edit Customer' : 'View Customer');
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{titleText}</span>
      </div>
    );
  }, [customerId, isEditMode, initialValues]);

  const fields = [
    {
      name: 'code',
      label: 'Code',
      span: 'span2',
      validator: Yup.string().required('Code is required'),
    },
    {
      name: 'name',
      label: 'Company Name',
      span: 'span2',
      validator: Yup.string().required('Company name is required'),
    },
    {
      name: 'customerName',
      label: 'Contact Person',
      span: 'span2',
      validator: Yup.string().required('Contact person is required'),
    },
    {
      name: 'contactNumber',
      label: 'Contact Number',
      type: 'tel',
      span: 'span2',
      validator: Yup.string()
        .required('Contact number is required')
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      span: 'span2',
      validator: Yup.string()
        .email('Enter a valid email address'),
    },
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
      validator: Yup.string().required('VAT type is required'),
    },
    {
      name: 'address',
      label: 'Address',
      span: 'span3',
      multiline: true,
      rows: 3,
      validator: Yup.string().required('Address is required'),
    },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Customer"
      icon={<FiUsers />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const { name, code, customerName, contactNumber, address, companyName, email, vatType } =
          values || {};
        const payload = { name, code, customerName, contactNumber, address, companyName, email, vatType };

        if (!customerId) {
          const res = await createCustomer(payload);
          if (res?.error) toast.error('Failed to create customer');
          else toast.success('Customer created');
          try {
            router.push('/customers');
          } catch (err) {}
          return '/customers';
        }

        const res = await updateCustomer(customerId, payload);
        if (res?.error) toast.error('Failed to save customer');
        else toast.success('Customer saved');
        try {
          router.push('/customers');
        } catch (err) {}
        return '/customers';
      }}
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
        ) : (
          <>
            {isReadOnly ? (
              canEnterEditMode ? (
                <Button variant="outlinedPrimary" onClick={() => setIsEditModeLocal(true)}>
                  Edit
                </Button>
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
                <Button type="submit" variant="save">
                  Save
                </Button>
              </>
            )}
          </>
        )
      }
    />
  );
}