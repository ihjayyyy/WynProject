"use client";

import React from 'react';
import InvoiceForm from '../InvoiceForm/InvoiceForm';
import SalesInvoiceService from '../../services/salesInvoiceService.js';

// Adapter that maps the SalesInvoiceService methods to the interface expected by InvoiceForm
const salesServiceFactory = () => {
  const svc = new SalesInvoiceService();
  return {
    getById: (id) => svc.getInvoiceById(id),
    getDetailsWithItemsByInvoiceGuid: (id) => svc.getDetailsWithItemsByInvoiceGuid(id),
    create: (payload) => svc.createInvoice(payload),
    update: (payload) => svc.updateInvoice(payload),
    subscribe: (cb) => SalesInvoiceService.subscribe(cb),
  };
};

export default function SalesInvoiceForm(props) {
  return (
    <InvoiceForm
      serviceFactory={salesServiceFactory}
      landingRoute="/sales/invoicelanding"
      title="Sales Invoice Form"
      saveType="SalesType"
      numberKey="SalesInvoiceNumber"
      orderKey="SalesOrderNumber"
      {...props}
    />
  );
}
