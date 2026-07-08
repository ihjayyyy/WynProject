'use client';

import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { useEffect, useMemo, useState } from 'react';
import Landing from '../ui/Landing/Landing';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { getAllPayments } from '@/services/PurchasePayments';

const baseColumns = [
  {
    header: 'Date',
    key: 'paymentDate',
    render: (item) =>
      item.paymentDate
        ? new Date(item.paymentDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
          })
        : '—',
  },
  { header: 'Supplier Receipt No.', key: 'supplierReceiptNumber' },
  { header: 'Payment No.', key: 'paymentNumber' },
  { header: 'Supplier', key: 'supplierName' },
  {
    header: 'Total Invoice Paid',
    key: 'totalAmountPaid',
    render: (item) => (
      <div style={{ textAlign: 'right' }}>
        {item.amount != null
          ? Number(item.totalAmountPaid).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : ''}
      </div>
    ),
  },
  {
    header: 'Amount',
    key: 'amount',
    render: (item) => (
      <div style={{ textAlign: 'right' }}>
        {item.amount != null
          ? Number(item.amount).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : ''}
      </div>
    ),
  },
  {
    header: 'Status',
    key: 'status',
    render: (item) => <StatusBadge status={item.status} />,
  },
];

export default function PurchasePaymentsLanding() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      const res = await getAllPayments();
      if (res.error) {
        setPayments([]);
      } else {
        setPayments(res.data || []);
      }
      setIsLoading(false);
    };
    fetchPayments();
  }, []);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(`/purchase/payments/paymentsform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) =>
          router.push(
            `/purchase/payments/paymentsform?id=${item.id}&mode=edit`,
          ),
      },
    ],
    [],
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        key: 'actions',
        sortable: false,
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems],
  );

  const paymentStats = useMemo(() => {
    const total = payments.length;
    const draftCount = payments.filter(
      (item) => String(item?.status || '').toLowerCase() === 'draft',
    ).length;
    const paidCount = payments.filter(
      (item) => String(item?.status || '').toLowerCase() === 'paid',
    ).length;
    const partialCount = payments.filter(
      (item) => String(item?.status || '').toLowerCase() === 'partiallypaid',
    ).length;
    const cancelledCount = payments.filter(
      (item) => String(item?.status || '').toLowerCase() === 'cancelled',
    ).length;
    const totalInvoiceAllocations = payments.reduce(
      (sum, item) => sum + (item.children || []).length,
      0,
    );
    const totalAmount = payments.reduce(
      (sum, item) => sum + Number(item?.amount || 0),
      0,
    );
    const totalNetAmount = payments.reduce(
      (sum, item) => sum + Number(item?.netAmount || 0),
      0,
    );
    const attentionCount = payments.filter((item) => {
      const status = String(item?.status || '').toLowerCase();
      const isTerminal = status === 'cancelled';
      return (
        !isTerminal &&
        (status === 'draft' ||
          status === 'partiallypaid' ||
          (item.children || []).some(
            (child) => Number(child?.balance || 0) > 0,
          ))
      );
    }).length;

    return [
      {
        key: 'total',
        label: 'Total Payments',
        number: total,
        change: `${paidCount} paid`,
        isPositive: true,
      },
      {
        key: 'amount',
        label: 'Total Amount',
        number: `PHP ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `PHP ${totalNetAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} net`,
        isPositive: true,
      },
      {
        key: 'attention',
        label: 'Needs Attention',
        number: attentionCount,
        change: `${draftCount} draft, ${partialCount} partial`,
        isPositive: attentionCount === 0,
      },
    ];
  }, [payments]);

  const filterFn = (item, keyword) => {
    return [item.name, item.code]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Payments"
      data={payments}
      columns={columns}
      stats={paymentStats}
      searchPlaceholder="Search payment"
      newButtonLabel="New payment"
      onNew={() => router.push('/purchase/payments/paymentsform')}
      emptyMessage={isLoading ? 'Loading payments...' : 'No payments found'}
      filterFn={filterFn}
    />
  );
}
