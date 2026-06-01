'use client';

import React, { useEffect, useMemo, useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiFileText } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { GetAll, printPurchaseOrder_byId } from '@/services/PurchaseOrder';
import InvalidPage from '@/components/InvalidPage/page';
import { AccessContext } from '@/app/contextProviders/accessContext';
import StatusBadge from '../ui/StatusBadge/StatusBadge';

const baseColumns = [
  { header: 'Order No', key: 'orderNumber' },
  {
    header: 'Date',
    key: 'orderDate',
    render: (item) =>
      item.orderDate
        ? new Date(item.orderDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          })
        : '—',
  },
  { header: 'Supplier', key: 'name' },
  { header: 'Supplier PO', key: 'supplierReferenceNo' },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <StatusBadge status={item.status} />,
  },
  { header: 'Amount', key: 'amount', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.amount != null ? Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedDate' },
];

export default function OrdersLanding() {
  const PageName = 'Purchase.Orders';
  const { isAllowed } = useContext(AccessContext);

  const router = useRouter();
  const [orders, setOrders] = useState([]);

  const getPO = async () => {
    const pos = await GetAll();
    setOrders(pos.data);
  };
  useEffect(() => {
    getPO();
  }, []);

  const actionItems = useMemo(
    () => [
      ...(isAllowed(PageName, 'r')
        ? [
            {
              key: 'view',
              label: 'View',
              icon: <FiEye size={14} />,
              onClick: (item) =>
                router.push(`/purchase/orders/ordersform?id=${item.id}`),
            },
          ]
        : []),
      ...(isAllowed(PageName, 'r')
        ? [
            {
              key: 'viewpdf',
              label: 'Print Document',
              icon: <FiFileText size={14} />,
              onClick: (item) => printPurchaseOrder_byId(item.id),
            },
          ]
        : []),
      // ...(isAllowed(PageName,'w')  ? [{ key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/purchase/orders/ordersform?id=${item.id}&mode=edit`) }]: []),
    ],
    [router],
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems],
  );

  const orderStats = [];
  // const orderStats = useMemo(() => {
  //   const total = orders.length;
  //   const totalItems = orders.reduce((s, o) => s + (o.itemsRequested ?? (o.items || []).length), 0);
  //   const totalQty = orders.reduce((s, o) => s + (o.items || []).reduce((ss, it) => ss + (it.qty || 0), 0), 0);
  //   const suppliers = new Set(
  //     orders
  //       .map((o) => {
  //         const supplierId = o.supplier?.id || (o.items && o.items[0] && o.items[0].supplierId);
  //         const found = sampleSuppliers.find(
  //           (s) => s.id === supplierId || s.code === supplierId || s.name === supplierId
  //         );
  //         return found ? found.name : o.supplier?.name ?? supplierId;
  //       })
  //       .filter(Boolean)
  //   ).size;
  //   return [
  //     { key: 'total', label: 'Total Orders', number: total, change: `${total} records`, isPositive: true },
  //     { key: 'items', label: 'Items Requested', number: totalItems, change: `${totalItems} items`, isPositive: true },
  //     { key: 'qty', label: 'Total Qty', number: totalQty, change: `${totalQty} units`, isPositive: true },
  //     { key: 'suppliers', label: 'Suppliers', number: suppliers, change: `${suppliers} unique`, isPositive: true },
  //   ];
  // }, [orders]);

  const filterFn = (item, keyword) => {
    const itemText = [
      item.id,
      item.orderNumber,
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

  return isAllowed(PageName, 'r') ? (
    <Landing
      title="Orders"
      data={orders}
      columns={columns}
      stats={orderStats}
      searchPlaceholder="Search orders"
      newButtonLabel={isAllowed(PageName, 'w') ? 'New Order' : ''}
      onNew={() => router.push('/purchase/orders/ordersform?mode=edit')}
      emptyMessage="No orders found"
      width="320px"
      filterFn={filterFn}
    />
  ) : (
    <InvalidPage />
  );
}
