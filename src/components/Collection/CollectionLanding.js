'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import CollectionService, { printSalesCollection_byId } from '@/services/Collection';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiXCircle, FiArchive, FiFileText, FiCheckCircle } from 'react-icons/fi';
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
        ? new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' })
        : '—',
  },
  { header: 'Receipt No.', key: 'receiptNumber' },
  {header: 'Collection No.', key: 'collectionNo'},
  { header: 'Customer', key: 'customerName' },
  { header: 'Description', key: 'description' },
  { header: 'Amount', key: 'amount', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.amount != null ? Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
  { header: 'Total Received', key: 'totalAmountReceived', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.totalAmountReceived != null ? Number(item.totalAmountReceived).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
  { header: 'Total Paid', key: 'totalAmountPaid', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.totalAmountPaid != null ? Number(item.totalAmountPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
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

  const refetchCollections = useCallback(async () => {
    const res = await CollectionService.getCollections();
    if (!res?.error) setCollections(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []));
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
          await refetchCollections();
        } else {
          toast.error('Failed to close collection.');
        }
      }
    );
  }, [confirmModal, toast, refetchCollections]);

  const handleMarkAsPaid = useCallback((item) => {
    confirmModal.show(
      'Mark as Paid',
      `Are you sure you want to mark collection "${item.collectionNo || item.id}" as paid?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await CollectionService.markCollectionAsPaid(item.id);
        if (!error) {
          toast.success('Collection marked as paid.');
          await refetchCollections();
        } else {
          toast.error('Failed to mark collection as paid.');
        }
      }
    );
  }, [confirmModal, toast, refetchCollections]);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/finance/collections/form?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/finance/collections/form?id=${item.id}&mode=edit`), hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        return s === 'billed' || s === 'cancelled' || s === 'closed';
      } },
      { key: 'viewpdf', label: 'Print Invoice', icon: <FiFileText size={14} />, onClick: (item) => printSalesCollection_byId(item.id) },
      { key: 'markaspaid', label: 'Mark as Paid', icon: <FiCheckCircle size={14} />, onClick: handleMarkAsPaid, hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        const totalPaid = Number(item?.totalAmountPaid) || 0;
        return s !== 'draft' || totalPaid === 0;
      } },
      { key: 'cancel', label: 'Cancel Collection', icon: <FiXCircle size={14} />, onClick: handleCancel, hidden: (item) => (item.status || '').toString().toLowerCase() === 'cancelled' },
      { key: 'close', label: 'Close Collection', icon: <FiArchive size={14} />, onClick: handleClose, hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        return s !== 'cancelled';
      } },
    ],
    [router, handleCancel, handleClose, handleMarkAsPaid]
  );

  const columns = useMemo(
    () => [...baseColumns, { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> }, { header: 'Action', key: 'actions', align: 'right', sortable: false, render: (item) => <DropdownAction item={item} items={actionItems.filter(a => !a.hidden || !a.hidden(item))} /> }],
    [actionItems]
  );

  const stats = useMemo(() => {
    const total = collections.length;
    const closedCount = collections.filter((item) => String(item?.status || '').toLowerCase() === 'closed').length;
    const totalAmount = collections.reduce((s, c) => s + (c.amount || 0), 0);
    const closedAmount = collections.reduce((sum, item) => {
      const status = String(item?.status || '').toLowerCase();
      return status === 'closed' ? sum + (Number(item.amount) || 0) : sum;
    }, 0);
    const draftCount = collections.filter((c) => {
      const status = String(c?.status || '').toLowerCase();
      const isTerminal = status === 'cancelled' || status === 'closed';
      return !isTerminal && status === 'draft';
    }).length;
    const remainingCount = collections.filter((c) => {
      const status = String(c?.status || '').toLowerCase();
      const amount = Number(c?.amount) || 0;
      const totalPaid = Number(c?.totalAmountPaid) || 0;
      const hasRemaining = amount > totalPaid;
      const isTerminal = status === 'cancelled' || status === 'closed';
      return !isTerminal && hasRemaining;
    }).length;
    const attentionCount = collections.filter((c) => {
      const status = String(c?.status || '').toLowerCase();
      const amount = Number(c?.amount) || 0;
      const totalPaid = Number(c?.totalAmountPaid) || 0;
      const hasRemaining = amount > totalPaid;
      const isTerminal = status === 'cancelled' || status === 'closed';
      return !isTerminal && (status === 'draft' || hasRemaining);
    }).length;
    return [
      { key: 'total', label: 'Total Collections', number: total, change: `${closedCount} closed`, isPositive: true },
      {
        key: 'amount',
        label: 'Total Amount',
        number: `PHP ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `PHP ${closedAmount.toFixed(2)} closed`,
        isPositive: true,
      },
      { key: 'attention', label: 'Needs Attention', number: attentionCount, change: `${draftCount} draft, ${remainingCount} with remaining`, isPositive: attentionCount === 0 },
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