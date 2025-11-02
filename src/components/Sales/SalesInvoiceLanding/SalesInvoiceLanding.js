"use client";

import React from 'react';
import InvoiceLanding from '../../Purchase/InvoiceLanding/InvoiceLanding';
import SalesInvoiceService from '../../../services/salesInvoiceService.js';
import { StatusBadge } from '../..';

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
    { key: 'Guid', header: 'CODE', sortable: true, align: 'start', render: (item) => <span style={{ fontWeight: 'bold' }}>{item.Guid}</span> },
    // Use the purchase keys so InvoiceLanding's selectedColumns (which reference purchase keys) still match.
    { key: 'PurchaseInvoiceNumber', header: 'REF NO.', sortable: true, render: (item) => <span>{item.SalesInvoiceNumber || item.PurchaseInvoiceNumber}</span> },
    { key: 'PurchaseOrderNumber', header: 'PO NUMBER', sortable: true, render: (item) => <span>{item.SalesOrderNumber || item.PurchaseOrderNumber}</span> },
    { key: 'Description', header: 'DESCRIPTION', sortable: true, render: (item) => <span>{item.Description}</span>, align: 'start' },
    { key: 'PurchaseType', header: 'TYPE', sortable: true, align: 'start', render: (item) => <span>{item.SalesType || item.PurchaseType}</span> },
    { key: 'Date', header: 'DATE', sortable: true },
    { key: 'DueDate', header: 'DUE DATE', sortable: true, align: 'start' },
    { key: 'PreparedBy', header: 'PREPARED BY', sortable: true },
    { key: 'ApprovedBy', header: 'APPROVED BY', sortable: true },
    { key: 'Status', header: 'STATUS', sortable: true, render: (item) => <StatusBadge status={item.Status} /> },
    { key: 'SupplierPO', header: 'SUPPLIER PO', sortable: true, render: (item) => <span>{item.SupplierSO || item.SupplierPO || ''}</span> },
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
