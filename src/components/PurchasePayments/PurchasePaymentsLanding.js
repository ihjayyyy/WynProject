'use client';

import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import { useEffect, useMemo, useState } from 'react';
import Landing from '../ui/Landing/Landing';
import { getAllPayments } from '@/services/PurchasePayments';

const baseColumns = [
  {
    header: 'Date',
    key: 'paymentDate',
    render: (item) =>
      item.paymentDate
        ? new Date(item.paymentDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          })
        : '—',
  },
  { header: 'Supplier Receipt No.', key: 'supplierReceiptNumber' },
  { header: 'Payment No.', key: 'paymentNumber' },
  { header: 'Supplier', key: 'supplierName' },
  { header: 'Amount', key: 'amount' },
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
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
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
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems],
  );

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
      searchPlaceholder="Search payment"
      newButtonLabel="New payment"
      onNew={() => router.push('/purchase/payments/paymentsform')}
      emptyMessage={isLoading ? 'Loading payments...' : 'No payments found'}
      filterFn={filterFn}
    />
  );
}
