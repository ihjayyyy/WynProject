'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiFileText } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { GetAll, printDelivery_byId } from '@/services/PurchaseDelivery';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
const baseColumns = [
  {
    header: 'Delivery Date',
    key: 'deliveryDate',
    render: (item) =>
      item.deliveryDate
        ? new Date(item.deliveryDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
          })
        : '—',
  },
  { header: 'Delivery No', key: 'deliveryNumber' },
  { header: 'Supplier', key: 'name' },
  { header: 'Order No', key: 'orderNumber' },
  { header: 'Supplier DR No', key: 'supplierDRNumber' },
  { header: 'Received By', key: 'receivedBy' },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <StatusBadge status={item.status} />,
  },
];

export default function DeliveryLanding() {
  const [deliveries, setDeliveries] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchDeliveries = async () => {
      const res = await GetAll();
      console.log(res);
      if (res && !res.error) {
        setDeliveries(res.data);
      }
    };

    fetchDeliveries();
  }, []);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(`/purchase/deliveries/deliveryform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) =>
          router.push(
            `/purchase/deliveries/deliveryform?id=${item.id}&mode=edit`,
          ),
      },
      {
        key: 'viewpdf',
        label: 'Print Document',
        icon: <FiFileText size={14} />,
        onClick: (item) => printDelivery_byId(item.id),
      },
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
        sortable: false,
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems],
  );

  const stats = useMemo(() => {
    const total = deliveries.length;
    const deliveredCount = deliveries.filter((item) => String(item?.status || '').toLowerCase() === 'delivered').length;
    const draftCount = deliveries.filter((item) => {
      const status = String(item?.status || '').toLowerCase();
      return status === 'draft';
    }).length;
    const pendingCount = deliveries.filter((item) => {
      const status = String(item?.status || '').toLowerCase();
      return status === 'pending' || status === 'for approval' || status === 'created';
    }).length;
    const attentionCount = draftCount + pendingCount;
    return [
      {
        key: 'total',
        label: 'Total Deliveries',
        number: total,
        change: `${deliveredCount} delivered`,
        isPositive: true,
      },
      {
        key: 'attention',
        label: 'Needs Attention',
        number: attentionCount,
        change: `${draftCount} draft, ${pendingCount} pending`,
        isPositive: attentionCount === 0,
      },
    ];
  }, [deliveries]);

  const filterFn = (item, keyword) => {
    const itemText = [
      item.id,
      item.code,
      item.name,
      item.orderId,
      item.status,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedAt,
      ...(item.items || []).map((it) => `${it.name} ${it.supplierId}`),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

    return itemText;
  };

  return (
    <Landing
      title="Purchase Deliveries"
      data={deliveries}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search deliveries"
      newButtonLabel="New Delivery"
      onNew={() => router.push('/purchase/deliveries/deliveryform')}
      emptyMessage="No deliveries found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
