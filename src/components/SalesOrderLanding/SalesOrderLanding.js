"use client";

import React from 'react';
import OrderLanding from '../OrderLanding/OrderLanding';
import SalesOrderService from '../../services/salesOrderService.js';
import {StatusBadge } from '../../components';

// Adapter factory to map sales order service to the landing's expected interface
const salesServiceFactory = () => {
  return {
    subscribe: (cb) => SalesOrderService.subscribe(cb),
    setStatus: ({ Guid, Status }) => {
      const svc = new SalesOrderService();
      return svc.setSalesOrderStatus({ Guid, Status });
    },
  };
};

export default function SalesOrderLandingWrapper(props) {
  const salesColumns = [
    { key: 'Guid', header: 'CODE', sortable: true, align: 'start', render: (item) => <span style={{ fontWeight: 'bold' }}>{item.Guid}</span> },
    // REF NO. corresponds to the sales order number for sales orders
    { key: 'SalesOrderNumber', header: 'REF NO.', sortable: true, render: (item) => <span>{item.SalesOrderNumber}</span> },
    // keep quotation number as a column as in OrderLanding
    { key: 'QuotationNumber', header: 'QUOTATION NO.', sortable: true },
    { key: 'Description', header: 'DESCRIPTION', sortable: true, render: (item) => <span>{item.Description}</span>, align: 'start' },
    { key: 'SalesType', header: 'TYPE', sortable: true, align: 'start' },
    { key: 'Date', header: 'DATE', sortable: true },
    { key: 'ValidUntil', header: 'VALID UNTIL', sortable: true, align: 'start' },
    { key: 'PreparedBy', header: 'PREPARED BY', sortable: true },
    { key: 'ApprovedBy', header: 'APPROVED BY', sortable: true },
    { key: 'Status', header: 'STATUS', sortable: true, render: (item) => <StatusBadge status={item.Status} /> },
    { key: 'SupplierSO', header: 'SUPPLIER SO', sortable: true },
    { key: 'OrderAmount', header: 'AMOUNT', sortable: true, render: (item) => <span>₱{Number(item.OrderAmount || 0).toLocaleString()}</span>, align: 'end' },
  ];

  return (
    <OrderLanding
      serviceFactory={salesServiceFactory}
      formRoute="/sales/orderform"
      title="Sales Orders"
      columns={salesColumns}
      filterConfig={{ label: 'Sales Type', key: 'supplierType', options: [{ value: '', label: 'All' }, { value: 'inventory', label: 'Inventory' }, { value: 'service', label: 'Service' }] }}
      {...props}
    />
  );
}
