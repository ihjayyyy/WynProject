"use client";

import React from "react";
import SalesQuotationService from '../../../services/salesQuotationService.js';
import QuotationForm from '../../Purchase/QuotationForm/QuotationForm.js';

// Adapter that maps the SalesQuotationService methods to the interface expected by QuotationForm
const salesServiceFactory = () => {
  const svc = new SalesQuotationService();
  return {
    getById: (id) => svc.getSalesQuotationById(id),
    getDetailsWithItemsByQuotationGuid: (id) => svc.getDetailsWithItemsByQuotationGuid(id),
    create: (payload) => svc.createSalesQuotation(payload),
    update: (payload) => svc.updateSalesQuotation(payload),
    subscribe: (cb) => SalesQuotationService.subscribe(cb)
  };
};

export default function SalesQuotationForm(props) {
  return (
    <QuotationForm
      serviceFactory={salesServiceFactory}
      landingRoute="/sales/quotationlanding"
      convertRoute="/sales/orderform"
      title="Sales Quotation Form"
      saveType="SalesType"
      {...props}
    />
  );
}
