"use client";

import React from 'react';
import DeliveryLanding from '../../Purchase/DeliveryLanding/DeliveryLanding';
import SalesDeliveryService from '../../../services/salesDeliveryService.js';
import { StatusBadge } from '../..';

// Adapter factory to map sales delivery service to the landing's expected interface
const salesServiceFactory = () => {
  return {
    subscribe: (cb) => SalesDeliveryService.subscribe(cb),
    setStatus: ({ Guid, Status }) => {
      const svc = new SalesDeliveryService();
      return svc.setSalesDeliveryStatus({ Guid, Status });
    },
  };
};

export default function SalesDeliveryLandingWrapper(props) {
  const salesColumns = [
    { key: 'Guid', header: 'DELIVERY CODE', sortable: true, align: 'start', render: (item) => <span style={{ fontWeight: 'bold' }}>{item.Guid}</span> },
    { key: 'PurchaseDeliveryNumber', header: 'REF NO.', sortable: true, render: (item) => <span>{item.SalesDeliveryNumber || item.PurchaseDeliveryNumber}</span> },
    { key: 'OrderGuid', header: 'ORDER NO.', sortable: true, render: (item) => <span>{item.SalesOrderNumber || item.OrderGuid}</span> },
    { key: 'Description', header: 'DESCRIPTION', sortable: true, render: (item) => <span>{item.Description}</span>, align: 'start' },
    { key: 'PurchaseType', header: 'TYPE', sortable: true, align: 'start', render: (item) => <span>{item.SalesType || item.PurchaseType}</span> },
    { key: 'Date', header: 'DATE', sortable: true },
    { key: 'PreparedBy', header: 'PREPARED BY', sortable: true },
    { key: 'AcceptedBy', header: 'ACCEPTED BY', sortable: true },
    { key: 'Status', header: 'STATUS', sortable: true, render: (item) => <StatusBadge status={item.Status} /> },
    { key: 'SupplierPO', header: 'SUPPLIER PO', sortable: true, render: (item) => <span>{item.SupplierSO || item.SupplierPO || ''}</span> },
  ];

  return (
    <DeliveryLanding
      serviceFactory={salesServiceFactory}
      formRoute="/sales/deliveryform"
      title="Sales Deliveries"
      columns={salesColumns}
      filterConfig={{ label: 'Sales Type', key: 'purchaseType', options: [{ value: '', label: 'All' }, { value: 'Inventory', label: 'Inventory' }, { value: 'Service', label: 'Service' }] }}
      {...props}
    />
  );
}
