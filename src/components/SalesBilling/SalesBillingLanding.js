'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import SalesBillingService from '@/services/SalesBilling';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiCheckCircle } from 'react-icons/fi';
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
      { key: 'viewpdf', label: 'Generate Billing Document', icon: <FiEye size={14} />, onClick: (item) => (getPDF(item.id))},
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/finance/billings/form?id=${item.id}&mode=edit`), hidden: (item) => item.status?.toLowerCase() === 'billed' },
      { key: 'markAsBilled', label: 'Mark as Billed', icon: <FiCheckCircle size={14} />, onClick: handleMarkAsBilled, hidden: (item) => item.status?.toLowerCase() !== 'draft' },
    ],
    [router, handleMarkAsBilled]
  );

    const getPDF = async (id) =>{
      console.log("billing",id);
      await SalesBillingService.getSalesBillingPDFById(id);
  }

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
