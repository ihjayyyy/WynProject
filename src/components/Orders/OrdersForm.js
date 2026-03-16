'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { FiList } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import Button from '../ui/Button/Button';
import { initialOrderState, orders as sampleOrders } from './ordersData';
import { sampleSuppliers } from '../Suppliers/suppliersData';

export default function OrdersForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const mode = searchParams.get('mode');
  const [isEditModeLocal, setIsEditModeLocal] = useState(false);
  const isEditMode = mode === 'edit' || isEditModeLocal;

  const initialValues = useMemo(() => {
    if (!orderId) return initialOrderState;
    const selected = sampleOrders.find((r) => r.id === orderId || r.code === orderId);
    return selected || initialOrderState;
  }, [orderId]);

  const { isReadOnly, canEnterEditMode } = useMemo(() => {
    const exists = Boolean(orderId && sampleOrders.some((r) => r.id === orderId || r.code === orderId));
    const readOnly = exists && !isEditMode;
    return { isReadOnly: readOnly, canEnterEditMode: exists };
  }, [orderId, isEditMode]);

  const formTitle = useMemo(() => {
    if (!orderId) return 'Orders Form';
    if (isEditMode) return 'Edit Order';
    return 'View Order';
  }, [orderId, isEditMode]);

  const supplierOptions = sampleSuppliers.map((s) => ({ label: s.name, value: s.id }));

  const fields = [
    { name: 'code', label: 'Code', span: 'span2' },
    { name: 'name', label: 'Name', span: 'span2' },
    { name: 'id', label: 'Id', span: 'span2' },
    { name: 'requestedBy', label: 'Requested By', span: 'span2' },
    { name: 'supplierId', label: 'Supplier', type: 'select', options: supplierOptions, searchable: true, span: 'span2', onChange: (val, values, setValues) => {
      const found = sampleSuppliers.find((s) => s.id === val);
      if (found) setValues({ ...values, supplier: { id: found.id, name: found.name } });
    } },
    { name: 'itemsRequested', label: 'Items Requested', type: 'number', span: 'span1' },
    { name: 'itemsSummary', label: 'Items (summary)', span: 'span3', multiline: true, rows: 3 },
  ];

  return (
    <EntityForm
      title={formTitle}
      breadcrumbLabel="Order Details"
      icon={<FiList />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={async (values) => {
        const now = new Date().toISOString().slice(0, 10);
        // Create
        if (!orderId) {
          const nextNumber = (sampleOrders || []).reduce((max, item) => {
            const parts = (item.code || '').split('-');
            const num = Number(parts[1]) || 0;
            return Math.max(max, num);
          }, 0) + 1;
          const newCode = `ORD-${String(nextNumber).padStart(3, '0')}`;
          const newId = String((sampleOrders || []).length + 1);
          const newItem = {
            ...values,
            id: newId,
            code: newCode,
            supplier: values.supplier || { id: values.supplierId || '', name: '' },
            createdBy: 'You',
            createdDate: now,
            updatedBy: 'You',
            updatedDate: now,
          };
          sampleOrders.push(newItem);
          return '/purchase/orders';
        }

        // Update
        const idx = (sampleOrders || []).findIndex((i) => i.id === orderId || i.code === orderId);
        const updatedItem = {
          ...values,
          id: orderId,
          supplier: values.supplier || { id: values.supplierId || '', name: '' },
          updatedBy: 'You',
          updatedDate: now,
        };
        if (idx !== -1) sampleOrders[idx] = updatedItem;
        return '/purchase/orders';
      }}
      backPath="/purchase/orders"
      width="100%"
      columns={3}
      showSubmitButton={false}
      readOnly={isReadOnly}
      headerActions={
        !orderId ? (
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
                      router.push(`/purchase/orders/ordersform?id=${orderId}`);
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
