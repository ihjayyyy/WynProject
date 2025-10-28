"use client";

import React from 'react';
import DeliveryLanding from '../DeliveryLanding/DeliveryLanding';
import SalesDeliveryService from '../../services/salesDeliveryService.js';
import { StatusBadge } from '../../components';

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
    { key: 'Guid', header: 'CODE', sortable: true },
    { key: 'SalesDeliveryNumber', header: 'SALES DELIVERY NO.', sortable: true },
    { key: 'Description', header: 'DESCRIPTION', sortable: true },
    { key: 'SalesType', header: 'TYPE', sortable: true },
    { key: 'Date', header: 'DATE', sortable: true },
    { key: 'PreparedBy', header: 'PREPARED BY', sortable: true },
    { key: 'AcceptedBy', header: 'ACCEPTED BY', sortable: true },
    { key: 'Status', header: 'STATUS', sortable: true, render: (item) => <StatusBadge status={item.Status} /> },
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
