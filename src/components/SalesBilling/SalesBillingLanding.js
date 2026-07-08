'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import SalesBillingService from '@/services/SalesBilling';
import Collection from '@/services/Collection';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiCheckCircle, FiFileText, FiXCircle, FiArchive, FiClock, FiX } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { useToast } from '../ui/Toast/Toast';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import { SalesBillingDetailsColumns } from './SalesBillingModels';

const baseColumns = [
  { header: 'Billing No.', key: 'salesBillingNo' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Description', key: 'description' },
  { header: 'Billing Type', key: 'billingType' },
  { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
  { header: 'Amount', key: 'amount', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.amount != null ? Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
  { header: 'Balance', key: 'balance', render: (item) => (
    <div style={{ textAlign: 'right' }}>
      {item.balance != null ? Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
    </div>
  ) },
  { header: 'Payment Status', key: 'paymentStatus', render: (item) => <StatusBadge status={item.paymentStatus} /> },
];

export default function SalesBillingLanding() {
  const [billings, setBillings] = useState([]);
  const router = useRouter();
  const confirmModal = useConfirmModal();
  const toast = useToast();

  // --- Collection history modal state ---
  const [historyModal, setHistoryModal] = useState({
    open: false,
    loading: false,
    billing: null,
    collections: [],
    error: null,
  });

  useEffect(() => {
    SalesBillingService.getSalesBilling().then(({ data, error }) => {
      if (!error && Array.isArray(data)) {
        setBillings(data);
      } else if (!error && data) {
        setBillings(Array.isArray(data) ? data : [data]);
      }
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

  const handleViewCollectionHistory = useCallback(async (item) => {
    setHistoryModal({ open: true, loading: true, billing: item, collections: [], error: null });

    const { data, error } = await Collection.getCollectionsByBillingId(item.id);

    if (error) {
      setHistoryModal((prev) => ({ ...prev, loading: false, error: error?.message || error || 'Failed to load collection history.' }));
      return;
    }

    const collections = Array.isArray(data) ? data : (data ? [data] : []);
    setHistoryModal((prev) => ({ ...prev, loading: false, collections }));
  }, []);

  const closeHistoryModal = useCallback(() => {
    setHistoryModal({ open: false, loading: false, billing: null, collections: [], error: null });
  }, []);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/finance/billings/form?id=${item.id}`) },
      { key: 'viewpdf', label: 'Print Request Letter', icon: <FiFileText size={14} />, onClick: async (item) => (await SalesBillingService.printSalesBilling_byId(item.id)) },
      {
        key: 'history',
        label: 'View Collection History',
        icon: <FiClock size={14} />,
        onClick: handleViewCollectionHistory,
        hidden: (item) => {
          const ps = (item.paymentStatus || '').toString().toLowerCase().replace(/\s+/g, '');
          return ps !== 'paid' && ps !== 'partiallypaid';
        },
      },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/finance/billings/form?id=${item.id}&mode=edit`), hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        return s === 'billed' || s === 'cancelled' || s === 'closed';
      } },
      { key: 'markAsBilled', label: 'Mark as Billed', icon: <FiCheckCircle size={14} />, onClick: handleMarkAsBilled, hidden: (item) => item.status?.toLowerCase() !== 'draft' },
      { key: 'cancel', label: 'Cancel Billing', icon: <FiXCircle size={14} />, onClick: handleCancel, hidden: (item) => (item.status || '').toString().toLowerCase() === 'cancelled' },
      { key: 'close', label: 'Close Billing', icon: <FiArchive size={14} />, onClick: handleClose, hidden: (item) => {
        const s = (item.status || '').toString().toLowerCase();
        return s !== 'cancelled';
      } },
    ],
    [router, handleMarkAsBilled, handleCancel, handleClose, handleViewCollectionHistory]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', sortable: false, align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = billings.length;
    const billedCount = billings.filter((item) => String(item?.status || '').toLowerCase() === 'billed').length;
    const totalAmount = billings.reduce((s, b) => s + (b.amount || 0), 0);
    const billedAmount = billings.reduce((sum, item) => {
      const status = String(item?.status || '').toLowerCase();
      return status === 'billed' ? sum + (Number(item.amount) || 0) : sum;
    }, 0);
    const draftCount = billings.filter((b) => {
      const status = String(b?.status || '').toLowerCase();
      const isTerminal = status === 'cancelled' || status === 'closed';
      return !isTerminal && status === 'draft';
    }).length;
    const unpaidCount = billings.filter((b) => {
      const status = String(b?.status || '').toLowerCase();
      const paymentStatus = String(b?.paymentStatus || '').toLowerCase();
      const isTerminal = status === 'cancelled' || status === 'closed';
      return !isTerminal && paymentStatus === 'unpaid';
    }).length;
    const partialCount = billings.filter((b) => {
      const status = String(b?.status || '').toLowerCase();
      const paymentStatus = String(b?.paymentStatus || '').toLowerCase();
      const isTerminal = status === 'cancelled' || status === 'closed';
      return !isTerminal && paymentStatus === 'partial';
    }).length;
    const balanceCount = billings.filter((b) => {
      const status = String(b?.status || '').toLowerCase();
      const hasBalance = Number(b?.balance) > 0;
      const isTerminal = status === 'cancelled' || status === 'closed';
      return !isTerminal && hasBalance;
    }).length;
    const attentionCount = billings.filter((b) => {
      const status = String(b?.status || '').toLowerCase();
      const paymentStatus = String(b?.paymentStatus || '').toLowerCase();
      const hasBalance = Number(b?.balance) > 0;
      const isTerminal = status === 'cancelled' || status === 'closed';
      return !isTerminal && (status === 'draft' || paymentStatus === 'unpaid' || paymentStatus === 'partial' || hasBalance);
    }).length;
    return [
      { key: 'total', label: 'Total Billings', number: total, change: `${billedCount} billed`, isPositive: true },
      {
        key: 'amount',
        label: 'Total Amount',
        number: `PHP ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `PHP ${billedAmount.toFixed(2)} billed`,
        isPositive: true,
      },
      { key: 'attention', label: 'Needs Attention', number: attentionCount, change: `${draftCount} draft, ${unpaidCount} unpaid, ${partialCount} partial, ${balanceCount} with balance`, isPositive: attentionCount === 0 },
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
    <>
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

      <ConfirmModal
        open={historyModal.open}
        wide
        title={`Collection History${historyModal.billing ? ` — ${historyModal.billing.salesBillingNo || historyModal.billing.id}` : ''}`}
        message=""
        showCancel={false}
        confirmText="Close"
        confirmVariant="primary"
        onConfirm={closeHistoryModal}
        onCancel={closeHistoryModal}
      >
        <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '12px' }}>
          {historyModal.loading && <div>Loading...</div>}

          {!historyModal.loading && historyModal.error && (
            <div style={{ color: '#c0392b' }}>{historyModal.error}</div>
          )}

          {!historyModal.loading && !historyModal.error && historyModal.collections.length === 0 && (
            <div style={{ padding: '12px 8px', textAlign: 'center', color: '#999' }}>
              No collection history found for this billing.
            </div>
          )}

          {!historyModal.loading && !historyModal.error && historyModal.collections.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ padding: '6px 8px', color: '#64748b' }}>Collection No.</th>
                  <th style={{ padding: '6px 8px', color: '#64748b' }}>Customer</th>
                  <th style={{ padding: '6px 8px', color: '#64748b' }}>Date</th>
                  <th style={{ padding: '6px 8px', color: '#64748b', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '6px 8px', color: '#64748b', textAlign: 'right' }}>Amount Paid</th>
                  <th style={{ padding: '6px 8px', color: '#64748b', textAlign: 'right' }}>Withholding Tax</th>
                  <th style={{ padding: '6px 8px', color: '#64748b' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {historyModal.collections.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>{c.collectionNo}</td>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>{c.customerName}</td>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      {c.date ? new Date(c.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }) : ''}
                    </td>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top', textAlign: 'right' }}>
                      {c.amount != null ? Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    </td>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top', textAlign: 'right' }}>
                      {c.totalAmountPaid != null ? Number(c.totalAmountPaid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    </td>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top', textAlign: 'right' }}>
                      {c.totalWithholdingTax != null ? Number(c.totalWithholdingTax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    </td>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </ConfirmModal>
    </>
  );
}