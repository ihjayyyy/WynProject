"use client";

import React from 'react';
import DeliveryForm from '../DeliveryForm/DeliveryForm';
import SalesDeliveryService from '../../services/salesDeliveryService.js';

// Adapter that maps the SalesDeliveryService methods to the interface expected by DeliveryForm
const salesServiceFactory = () => {
  const svc = new SalesDeliveryService();
  return {
    getById: (id) => svc.getSalesDeliveryById(id),
    getDetailsWithItemsByDeliveryGuid: (id) => svc.getDetailsWithItemsByDeliveryGuid(id),
    create: (payload) => svc.createSalesDelivery(payload),
    update: (payload) => svc.updateSalesDelivery(payload),
    subscribe: (cb) => SalesDeliveryService.subscribe(cb),
  };
};

export default function SalesDeliveryForm(props) {
  return (
    <DeliveryForm
      serviceFactory={salesServiceFactory}
      landingRoute="/sales/deliverylanding"
      title="Sales Delivery Form"
      saveType="SalesType"
      {...props}
    />
  );
}
