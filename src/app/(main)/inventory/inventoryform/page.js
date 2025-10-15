'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import EntityForm from '@/components/EntityForm/EntityForm';
import { InventoryService } from '@/services/inventoryService';
import { FiPackage } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';

export default function Page() {
  const inventoryService = useMemo(() => new InventoryService(), []);
  const searchParams = useSearchParams();
  const id = searchParams?.get ? searchParams.get('id') : null;
  const mode = searchParams?.get ? searchParams.get('mode') : null;
  const readOnly = mode === 'view';

  const [initialValues, setInitialValues] = useState({
    Name: '',
    Description: '',
    ProductCode: '',
    ProductType: '',
    UnitPrice: 0,
    Guid: undefined,
  });

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

  useEffect(() => {
    let mounted = true;
    if (id) {
      (async () => {
        try {
          const item = await inventoryService.getInventoryById(id);
          if (!mounted) return;
          if (item) setInitialValues({ ...item });
        } catch (err) {
          console.error('Failed to load inventory', err);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [id, inventoryService]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        if (id) {
          await inventoryService.updateInventory({ ...initialValues, ...values });
        } else {
          await inventoryService.addInventory(values);
        }
      } catch (err) {
        console.error('Failed to save inventory', err);
        throw err;
      }
    },
    [inventoryService, id, initialValues]
  );

  return (
    <EntityForm
      title="Inventory Form"
      icon={<FiPackage size={18} />}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      readOnly={readOnly}
      backPath="/inventory"
    />
  );
}
