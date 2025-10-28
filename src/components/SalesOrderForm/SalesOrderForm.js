"use client";

import React from 'react';
import OrderForm from '../OrderForm/OrderForm';
import SalesOrderService from '../../services/salesOrderService.js';

// Adapter that maps the SalesOrderService methods to the interface expected by OrderForm
const salesServiceFactory = () => {
  const svc = new SalesOrderService();
  return {
    getById: (id) => svc.getSalesOrderById(id),
    getDetailsWithItemsByOrderGuid: (id) => svc.getDetailsByOrderGuid(id),
    create: (payload) => svc.createSalesOrder(payload),
    update: (payload) => svc.updateSalesOrder(payload),
    subscribe: (cb) => SalesOrderService.subscribe(cb),
  };
};

export default function SalesOrderForm(props) {
  return (
    <OrderForm
      serviceFactory={salesServiceFactory}
      landingRoute="/sales/orderlanding"
      deliveryFormRoute="/sales/deliveryform"
      title="Sales Order Form"
      saveType="SalesType"
      {...props}
    />
  );
}
