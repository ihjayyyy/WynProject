'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { orders as sampleOrders } from './ordersData';
import { sampleSuppliers } from '../Suppliers/suppliersData';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  { header: 'Requested By', key: 'requestedBy' },
  { header: 'Items', key: 'itemsRequested' },
  {
    header: 'Qty',
    key: 'qty',
    render: (item) => (item.items || []).reduce((s, it) => s + (it.qty || 0), 0),
  },
  {
    header: 'Supplier',
    key: 'supplierName',
    render: (item) => {
      const supplierId = item.supplier?.id || (item.items && item.items[0] && item.items[0].supplierId);
      if (!supplierId) return '';
      const found = sampleSuppliers.find(
        (s) => s.id === supplierId || s.code === supplierId || s.name === supplierId
      );
      return found ? found.name : item.supplier?.name ?? supplierId;
    },
  },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function OrdersLanding() {
  const [orders] = useState(sampleOrders);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/purchase/orders/ordersform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/purchase/orders/ordersform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const totalItems = orders.reduce((s, o) => s + (o.itemsRequested ?? (o.items || []).length), 0);
    const totalQty = orders.reduce((s, o) => s + (o.items || []).reduce((ss, it) => ss + (it.qty || 0), 0), 0);
    const suppliers = new Set(
      orders
        .map((o) => {
          const supplierId = o.supplier?.id || (o.items && o.items[0] && o.items[0].supplierId);
          const found = sampleSuppliers.find(
            (s) => s.id === supplierId || s.code === supplierId || s.name === supplierId
          );
          return found ? found.name : o.supplier?.name ?? supplierId;
        })
        .filter(Boolean)
    ).size;
    return [
      { key: 'total', label: 'Total Orders', number: total, change: `${total} records`, isPositive: true },
      { key: 'items', label: 'Items Requested', number: totalItems, change: `${totalItems} items`, isPositive: true },
      { key: 'qty', label: 'Total Qty', number: totalQty, change: `${totalQty} units`, isPositive: true },
      { key: 'suppliers', label: 'Suppliers', number: suppliers, change: `${suppliers} unique`, isPositive: true },
    ];
  }, [orders]);

  const filterFn = (item, keyword) => {
    const itemText = [
      item.id,
      item.code,
      item.name,
      item.requestedBy,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      item.supplier?.name,
      ...(item.items || []).map((it) => `${it.name} ${it.supplierId}`),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

    return itemText;
  };

  return (
    <Landing
      title="Orders"
      data={orders}
      columns={columns}
      stats={orderStats}
      searchPlaceholder="Search orders"
      newButtonLabel="New Order"
      onNew={() => router.push('/purchase/orders/ordersform')}
      emptyMessage="No orders found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
