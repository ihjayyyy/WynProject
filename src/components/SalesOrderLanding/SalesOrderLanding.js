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
    { key: 'Guid', header: 'CODE', sortable: true },
    { key: 'SalesOrderNumber', header: 'SALES ORDER NO.', sortable: true },
    { key: 'Description', header: 'DESCRIPTION', sortable: true },
    { key: 'SalesType', header: 'TYPE', sortable: true },
    { key: 'Date', header: 'DATE', sortable: true },
    { key: 'ValidUntil', header: 'VALID', sortable: true },
    { key: 'Status', header: 'STATUS', sortable: true, render: (item) => <StatusBadge status={item.Status} /> },
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
