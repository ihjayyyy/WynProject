'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import CollectionService from '@/services/Collection';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';

const baseColumns = [
  { header: 'Receipt No.', key: 'receiptNumber' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Description', key: 'description' },
  { header: 'Date', key: 'date' },
  { header: 'Amount', key: 'amount' },
  { header: 'Total Received', key: 'totalAmountReceived' },
  { header: 'Total Paid', key: 'totalAmountPaid' },
];

export default function CollectionLanding() {
  const [collections, setCollections] = useState([]);
  const router = useRouter();

  useEffect(() => {
    CollectionService.getCollections().then(({ data, error }) => {
      if (!error && data) {
        setCollections(Array.isArray(data) ? data : [data]);
      }
    });
  }, []);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/finance/collections/form?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/finance/collections/form?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(
    () => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }],
    [actionItems]
  );

  const stats = useMemo(() => {
    const total = collections.length;
    const totalAmount = collections.reduce((s, c) => s + (c.amount || 0), 0);
    return [
      { key: 'total', label: 'Total Collections', number: total, change: `${total} records`, isPositive: true },
      { key: 'amount', label: 'Total Amount', number: totalAmount, change: `${totalAmount} total`, isPositive: true },
    ];
  }, [collections]);

  const filterFn = (item, keyword) =>
    [item.id, item.receiptNumber, item.customerName, item.description, item.amount]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

  return (
    <Landing
      title="Collections"
      data={collections}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search collections"
      newButtonLabel="New Collection"
      onNew={() => router.push('/finance/collections/form?mode=edit')}
      emptyMessage="No collections found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
