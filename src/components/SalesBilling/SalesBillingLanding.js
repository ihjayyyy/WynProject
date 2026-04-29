'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Status', key: 'status' },
  { header: 'Amount', key: 'amount' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function SalesBillingLanding() {
  // Replace with real data fetching logic
  const [billings] = useState([]); // sampleBillings
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/finance/billings/form?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/finance/billings/form?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = billings.length;
    const totalAmount = billings.reduce((s, b) => s + (b.amount || 0), 0);
    return [
      { key: 'total', label: 'Total Billings', number: total, change: `${total} records`, isPositive: true },
      { key: 'amount', label: 'Total Amount', number: totalAmount, change: `${totalAmount} total`, isPositive: true },
    ];
  }, [billings]);

  const filterFn = (item, keyword) => {
    const itemText = [
      item.id,
      item.code,
      item.customerName,
      item.status,
      item.amount,
      item.updatedBy,
      item.updatedDate,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

    return itemText;
  };

  return (
    <Landing
      title="Sales Billings"
      data={billings}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search billings"
      newButtonLabel="New Billing"
      onNew={() => router.push('/finance/billings/form?mode=edit')}
      emptyMessage="No billings found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
