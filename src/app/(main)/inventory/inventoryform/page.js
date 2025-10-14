'use client';

import React, { useCallback, useMemo } from 'react';
import EntityForm from '@/components/EntityForm/EntityForm';
import { InventoryService } from '@/services/inventoryService';
import { FiPackage } from 'react-icons/fi';

export default function Page() {
  const inventoryService = useMemo(() => new InventoryService(), []);

  const fields = [
    { name: 'Name', label: 'Product Name', span: 'span3' },
    { name: 'Description', label: 'Description', span: 'span3' },
    { name: 'ProductCode', label: 'Product Code', span: 'span2' },
    { name: 'ProductType', label: 'Product Type', span: 'span3' },
    {
      name: 'UnitPrice',
      label: 'Price',
      span: 'span2',
      type: 'number',
      rightAlign: true,
    },
  ];

  const handleSubmit = useCallback(
    async (values) => {
      // call supplier service create
      try {
        await inventoryService.addInventory(values);
      } catch (err) {
        console.error('Failed to create supplier', err);
        throw err;
      }
    },
    [inventoryService]
  );
  return (
    <EntityForm
      title="Inventory Form"
      icon={<FiPackage size={18} />}
      fields={fields}
      initialValues={{
        Name: '',
        Description: '',
        ProductCode: '',
        ProductType: '',
        UnitPrice: 0,
      }}
      onSubmit={handleSubmit}
      backPath="/inventory"
    />
  );
}
