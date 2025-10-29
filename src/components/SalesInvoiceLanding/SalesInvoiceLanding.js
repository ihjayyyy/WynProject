"use client";

import React from 'react';
import InvoiceLanding from '../InvoiceLanding/InvoiceLanding';
import SalesInvoiceService from '../../services/salesInvoiceService.js';
import { StatusBadge } from '../../components';

// Adapter factory to map sales invoice service to the landing's expected interface
const salesServiceFactory = () => {
  return {
    subscribe: (cb) => SalesInvoiceService.subscribe(cb),
    setStatus: ({ Guid, Status, ApprovedBy }) => {
      const svc = new SalesInvoiceService();
      return svc.setInvoiceStatus({ Guid, Status, ApprovedBy });
    },
  };
};

export default function SalesInvoiceLandingWrapper(props) {
  const salesColumns = [
    { key: 'Guid', header: 'CODE', sortable: true },
    { key: 'SalesInvoiceNumber', header: 'SALES INVOICE NO.', sortable: true },
    { key: 'SalesOrderNumber', header: 'SALES ORDER NO.', sortable: true },
    { key: 'Description', header: 'DESCRIPTION', sortable: true },
    { key: 'SalesType', header: 'TYPE', sortable: true },
    { key: 'Date', header: 'DATE', sortable: true },
    { key: 'DueDate', header: 'DUE DATE', sortable: true },
    { key: 'PreparedBy', header: 'PREPARED BY', sortable: true },
    { key: 'ApprovedBy', header: 'APPROVED BY', sortable: true },
    { key: 'Status', header: 'STATUS', sortable: true, render: (item) => <StatusBadge status={item.Status} /> },
    { key: 'InvoiceAmount', header: 'AMOUNT', sortable: true, render: (item) => <span>₱{Number(item.InvoiceAmount || 0).toLocaleString()}</span>, align: 'end' },
  ];

  return (
    <InvoiceLanding
      serviceFactory={salesServiceFactory}
      formRoute="/sales/invoiceform"
      title="Sales Invoices"
      columns={salesColumns}
      filterConfig={{ label: 'Sales Type', key: 'purchaseType', options: [{ value: '', label: 'All' }, { value: 'Inventory', label: 'Inventory' }, { value: 'Service', label: 'Service' }] }}
      {...props}
    />
  );
}
