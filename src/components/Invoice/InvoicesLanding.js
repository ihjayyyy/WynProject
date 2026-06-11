'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiFileText } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import Landing from '../ui/Landing/Landing';
import { GetAll, printPurchaseInvoice_byId } from '@/services/PurchaseInvoice';

const baseColumns = [
  // { header: 'Id', key: 'id' },,
  {
    header: 'Invoice Date',
    key: 'invoiceDate',
    render: (item) =>
      item.invoiceDate
        ? new Date(item.invoiceDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          })
        : '—',
  },
  { header: 'Invoice Number', key: 'invoiceNumber' },
  { header: 'Name', key: 'name' },
  {
    header: 'Due Date',
    key: 'dueDate',
    render: (item) =>
      item.dueDate
        ? new Date(item.dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          })
        : '—',
  },
  {
    header: 'Invoice Amount',
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
    header: 'Invoice Balance',
    key: 'balance',
    render: (item) => (
      <div style={{ textAlign: 'right' }}>
        {item.balance != null
          ? Number(item.balance).toLocaleString(undefined, {
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
  {
    header: 'Payment Status',
    key: 'paymentStatus',
    render: (item) => <StatusBadge status={item.paymentStatus} />,
  },
];

export default function InvoicesLanding() {
  const [invoices, setInvoices] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchInvoices = async () => {
      const res = await GetAll();
      console.log(res);
      if (res && !res.error) {
        setInvoices(res.data);
      }
    };

    fetchInvoices();
  }, []);

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) =>
          router.push(`/purchase/invoices/invoiceform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) =>
          router.push(`/purchase/invoices/invoiceform?id=${item.id}&mode=edit`),
      },
      {
        key: 'viewpdf',
        label: 'Print Invoice',
        icon: <FiFileText size={14} />,
        onClick: (item) => printPurchaseInvoice_byId(item.id),
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
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems],
  );

  const stats = useMemo(() => {
    const total = invoices.length;
    const invoicedCount = invoices.filter(
      (item) => String(item?.status || '').toLowerCase() === 'invoiced',
    ).length;
    const getInvoiceAmount = (invoice) =>
      Number(
        invoice.amount ??
          invoice.totalAmount ??
          (invoice.items || []).reduce(
            (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.price) || 0),
            0,
          ),
      );

    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + getInvoiceAmount(invoice),
      0,
    );
    const closedAmount = invoices.reduce((sum, item) => {
      const status = String(item?.status || '').toLowerCase();
      const invoiceAmount = getInvoiceAmount(item);
      return status === 'closed' ? sum + invoiceAmount : sum;
    }, 0);
    const unpaidCount = invoices.filter((d) => {
      const status = String(d?.status || '').toLowerCase();
      const paymentStatus = String(d?.paymentStatus || '').toLowerCase();
      const isTerminal = status === 'closed' || status === 'cancelled';
      return !isTerminal && paymentStatus === 'unpaid';
    }).length;
    const partialCount = invoices.filter((d) => {
      const status = String(d?.status || '').toLowerCase();
      const paymentStatus = String(d?.paymentStatus || '').toLowerCase();
      const isTerminal = status === 'closed' || status === 'cancelled';
      return !isTerminal && paymentStatus === 'partial';
    }).length;
    const overdueCount = invoices.filter((d) => {
      const status = String(d?.status || '').toLowerCase();
      const paymentStatus = String(d?.paymentStatus || '').toLowerCase();
      const isTerminal = status === 'closed' || status === 'cancelled';
      return !isTerminal && paymentStatus === 'overdue';
    }).length;
    const balanceCount = invoices.filter((d) => {
      const status = String(d?.status || '').toLowerCase();
      const hasBalance = Number(d?.balance) > 0;
      const isTerminal = status === 'closed' || status === 'cancelled';
      return !isTerminal && hasBalance;
    }).length;
    const attentionCount = invoices.filter((d) => {
      const status = String(d?.status || '').toLowerCase();
      const paymentStatus = String(d?.paymentStatus || '').toLowerCase();
      const hasBalance = Number(d?.balance) > 0;
      const isTerminal = status === 'closed' || status === 'cancelled';
      return (
        !isTerminal &&
        (paymentStatus === 'unpaid' ||
          paymentStatus === 'partial' ||
          paymentStatus === 'overdue' ||
          hasBalance)
      );
    }).length;
    return [
      {
        key: 'total',
        label: 'Total Invoices',
        number: total,
        change: `${invoicedCount} invoiced`,
        isPositive: true,
      },
      {
        key: 'amount',
        label: 'Total Amount',
        number: `PHP ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `PHP ${closedAmount.toFixed(2)} closed`,
        isPositive: true,
      },
      {
        key: 'attention',
        label: 'Needs Attention',
        number: attentionCount,
        change: `${unpaidCount} unpaid, ${partialCount} partial, ${overdueCount} overdue, ${balanceCount} with balance`,
        isPositive: attentionCount === 0,
      },
    ];
  }, [invoices]);

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
      item.updatedDate,
      ...(item.items || []).map((it) => `${it.name} ${it.supplierId}`),
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(keyword));

    return itemText;
  };

  return (
    <Landing
      title="Invoices"
      data={invoices}
      columns={columns}
      stats={stats}
      searchPlaceholder="Search invoices"
      newButtonLabel="New Invoice"
      onNew={() => router.push('/purchase/invoices/invoiceform')}
      emptyMessage="No invoices found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
