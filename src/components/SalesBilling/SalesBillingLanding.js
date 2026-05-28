'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import SalesBillingService from '@/services/SalesBilling';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiCheckCircle, FiFileText, FiXCircle, FiArchive } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { useToast } from '../ui/Toast/Toast';
import { SalesBillingDetailsColumns } from './SalesBillingModels';

const baseColumns = [
  // { header: 'Id', key: 'id' },
  { header: 'Billing No.', key: 'salesBillingNo' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Description', key: 'description' },
  { header: 'Billing Type', key: 'billingType' },
  { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
  { header: 'Amount', key: 'amount' },
  { header: 'Balance', key: 'balance' },
  { header: 'Payment Status', key: 'paymentStatus', render: (item) => <StatusBadge status={item.paymentStatus} /> },
  // { header: 'UpdatedBy', key: 'updatedBy' },
  // { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function SalesBillingLanding() {
  const [billings, setBillings] = useState([]);
  const router = useRouter();
  const confirmModal = useConfirmModal();
  const toast = useToast();

  useEffect(() => {
    SalesBillingService.getSalesBilling().then(({ data, error }) => {
      if (!error && Array.isArray(data)) {
        setBillings(data);
      } else if (!error && data) {
        setBillings(Array.isArray(data) ? data : [data]);
      }
      // Optionally handle error
    });
  }, []);

  const handleCancel = useCallback((item) => {
    confirmModal.show(
      'Cancel Billing',
      `Are you sure you want to cancel billing "${item.salesBillingNo || item.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await SalesBillingService.cancelSalesBilling(item.id);
        if (!error) {
          setBillings((prev) => prev.map((b) => (b.id === item.id ? { ...b, status: 'Cancelled' } : b)));
          toast.success('Billing cancelled.');
        } else {
          toast.error('Failed to cancel billing.');
        }
      }
    );
  }, [confirmModal, toast]);

  const handleClose = useCallback((item) => {
    confirmModal.show(
      'Close Billing',
      `Are you sure you want to close billing "${item.salesBillingNo || item.id}"?`,
      'Confirm',
      'primary',
      () => async () => {
        const { error } = await SalesBillingService.closeSalesBilling(item.id);
        if (!error) {
          toast.success('Billing closed.');
          // refetch list
          const res = await SalesBillingService.getSalesBilling();
          if (!res?.error) {
            setBillings(Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []));
          }
        } else {
          toast.error('Failed to close billing.');
        }
      }
    );
  }, [confirmModal, toast]);

  const handleMarkAsBilled = useCallback((item) => {
    confirmModal.show(
      'Mark as Billed',
      `Are you sure you want to mark billing "${item.salesBillingNo || item.id}" as billed?`,
      'Mark as Billed',
      'primary',
      () => async () => {
        const { error } = await SalesBillingService.markAsBilled(item.id);
        if (!error) {
          setBillings((prev) =>
            prev.map((b) => (b.id === item.id ? { ...b, status: 'Billed' } : b))
          );
          toast.success('Billing marked as billed.');
        } else {
          toast.error('Failed to mark as billed.');
        }
      }
    );
  }, [confirmModal, toast]);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/finance/billings/form?id=${item.id}`) },
      { key: 'viewpdf', label: 'Print Request Letter', icon: <FiFileText size={14} />, onClick: async (item) => (await SalesBillingService.printSalesBilling_byId(id))},
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/finance/billings/form?id=${item.id}&mode=edit`), hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        return s === 'billed' || s === 'cancelled' || s === 'closed';
      } },
      { key: 'markAsBilled', label: 'Mark as Billed', icon: <FiCheckCircle size={14} />, onClick: handleMarkAsBilled, hidden: (item) => item.status?.toLowerCase() !== 'draft' },
      // Cancel Billing - hidden when already cancelled
      { key: 'cancel', label: 'Cancel Billing', icon: <FiXCircle size={14} />, onClick: handleCancel, hidden: (item) => (item.status || '').toString().toLowerCase() === 'cancelled' },
      // Close Billing - shown only when status is Cancelled
      { key: 'close', label: 'Close Billing', icon: <FiArchive size={14} />, onClick: handleClose, hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        return s !== 'cancelled';
      } },
    ],
    [router, handleMarkAsBilled]
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
      item.billingNo,
      item.customerName,
      item.status,
      item.paymentStatus,
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
