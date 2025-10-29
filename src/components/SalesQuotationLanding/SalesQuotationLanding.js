"use client";

import SalesQuotationService from '../../services/salesQuotationService.js';
import {StatusBadge} from '../../components';

import QuotationLanding from '../QuotationLanding/QuotationLanding';

const salesServiceFactory = () => {
  return {
    subscribe: (cb) => SalesQuotationService.subscribe(cb),
    setStatus: ({ Guid, Status }) => {
      const svc = new SalesQuotationService();
      // map to sales status method
      return svc.setSalesQuotationStatus({ Guid, Status });
    },
  };
};

export default function SalesQuotationLandingWrapper(props) {
  const salesColumns = [
    { key: 'Guid', header: 'CODE', sortable: true, align: 'start', render: (item) => <span style={{ fontWeight: 'bold' }}>{item.Guid}</span> },
    { key: 'QuotationNumber', header: 'QUOTATION NO.', sortable: true },
    { key: 'Description', header: 'DESCRIPTION', sortable: true, render: (item) => <span>{item.Description}</span>, align: 'start' },
    // NOTE: this column key is Sales-specific and mirrors the Purchase landing's column shape
    { key: 'SalesType', header: 'TYPE', sortable: true, align: 'start' },
    { key: 'Date', header: 'DATE', sortable: true },
    { key: 'ValidUntil', header: 'VALID', sortable: true, align: 'start' },
    { key: 'Status', header: 'STATUS', sortable: true, align: 'start', render: (item) => <StatusBadge status={item.Status} /> },
  ];

  return (
    <QuotationLanding
      serviceFactory={salesServiceFactory}
      formRoute="/sales/quotationform"
      title="Sales Quotations"
      columns={salesColumns}
      filterConfig={{ label: 'Sales Type', key: 'supplierType', options: [{ value: '', label: 'All' }, { value: 'inventory', label: 'Inventory' }, { value: 'service', label: 'Service' }] }}
      {...props}
    />
  );
}
