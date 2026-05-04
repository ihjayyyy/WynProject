'use client';

import React, { useMemo, useState ,useEffect} from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { GetAll } from '@/services/PurchaseInvoice';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Invoice Date', key: 'invoiceDate' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
  {
    header: 'Due Date',
    key: 'dueDate',
  },
  {
    header: 'Invoice Amount',
    key: 'amount',
  },
  {
    header: 'Invoice Balance',
    key: 'balance',
  },
  {
    header: 'Status',
    key: 'status',
  },
    {
    header: 'Payment Status',
    key: 'paymentStatus',
  },
];

export default function InvoicesLanding() {
  const [invoices, setInvoices] = useState([]);
  const router = useRouter();

    useEffect(()=>{
      const fetchInvoices = async() => {
  
      const res = await GetAll();
      console.log(res)
       if(res && !res.error){
            setInvoices(res.data);
       }
     }
  
     fetchInvoices();
    },[])

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/purchase/invoices/invoiceform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/purchase/invoices/invoiceform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const totalItems = invoices.reduce((s, d) => s + (d.items || []).length, 0);
    const totalQty = invoices.reduce((s, d) => s + (d.items || []).reduce((ss, it) => ss + (it.qty || 0), 0), 0);
    const totalAmount = invoices.reduce((s, d) => s + (d.items || []).reduce((ss, it) => ss + ((it.qty || 0) * (it.price || 0)), 0), 0);
    const orders = new Set(invoices.map((d) => d.orderId).filter(Boolean)).size;
    return [
      { key: 'total', label: 'Total Invoices', number: total, change: `${total} records`, isPositive: true },
      { key: 'items', label: 'Items', number: totalItems, change: `${totalItems} items`, isPositive: true },
      { key: 'qty', label: 'Total Qty', number: totalQty, change: `${totalQty} units`, isPositive: true },
      { key: 'amount', label: 'Total Amount', number: totalAmount, change: `$${totalAmount}`, isPositive: true },
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
