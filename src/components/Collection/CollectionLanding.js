'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import CollectionService from '@/services/Collection';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiXCircle, FiArchive } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { useToast } from '../ui/Toast/Toast';
import StatusBadge from '../ui/StatusBadge/StatusBadge';

const baseColumns = [
    {
    header: 'Date',
    key: 'date',
    render: (item) =>
      item.date
        ? new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
        : '—',
  },
  { header: 'Receipt No.', key: 'receiptNumber' },
  {header: 'Collection No.', key: 'collectionNo'},
  { header: 'Customer', key: 'customerName' },
  { header: 'Description', key: 'description' },
  { header: 'Amount', key: 'amount' },
  { header: 'Total Received', key: 'totalAmountReceived' },
  { header: 'Total Paid', key: 'totalAmountPaid' },
];

export default function CollectionLanding() {
  const [collections, setCollections] = useState([]);
  const router = useRouter();
  const confirmModal = useConfirmModal();
  const toast = useToast();

  useEffect(() => {
    CollectionService.getCollections().then(({ data, error }) => {
      if (!error && data) {
        setCollections(Array.isArray(data) ? data : [data]);
      }
    });
  }, []);

  const handleCancel = useCallback((item) => {
    confirmModal.show(
      'Cancel Collection',
      `Are you sure you want to cancel collection "${item.collectionNo || item.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await CollectionService.cancelCollection(item.id);
        if (!error) {
          setCollections((prev) => prev.map((c) => (c.id === item.id ? { ...c, status: 'Cancelled' } : c)));
          toast.success('Collection cancelled.');
        } else {
          toast.error('Failed to cancel collection.');
        }
      }
    );
  }, [confirmModal, toast]);

  const handleClose = useCallback((item) => {
    confirmModal.show(
      'Close Collection',
      `Are you sure you want to close collection "${item.collectionNo || item.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await CollectionService.closeCollection(item.id);
        if (!error) {
          toast.success('Collection closed.');
          // refetch collections
          const res = await CollectionService.getCollections();
          if (!res?.error) setCollections(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []));
        } else {
          toast.error('Failed to close collection.');
        }
      }
    );
  }, [confirmModal, toast]);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/finance/collections/form?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/finance/collections/form?id=${item.id}&mode=edit`), hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        return s === 'billed' || s === 'cancelled' || s === 'closed';
      } },
      { key: 'cancel', label: 'Cancel Collection', icon: <FiXCircle size={14} />, onClick: handleCancel, hidden: (item) => (item.status || '').toString().toLowerCase() === 'cancelled' },
      { key: 'close', label: 'Close Collection', icon: <FiArchive size={14} />, onClick: handleClose, hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        return s !== 'cancelled';
      } },
    ],
    [router, handleCancel, handleClose]
  );

  const columns = useMemo(
    () => [...baseColumns, { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> }, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems.filter(a => !a.hidden || !a.hidden(item))} /> }],
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
    [item.id, item.receiptNumber, item.customerName, item.description, item.collectionNo, item.status]
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
