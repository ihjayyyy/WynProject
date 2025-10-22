"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ThreeColumnLayout from '../ThreeColumnLayout/ThreeColumnLayout';
import RightPanel from '../RightPanel/RightPanel';
import SalesQuotationService from '../../services/salesQuotationService.js';
import styles from '../QuotationLanding/QuotationLanding.module.scss';
import { StatsCard, SearchBar, DataTable, StatusBadge, DropdownAction } from '../../components';
import { FiEye, FiCheck, FiX } from 'react-icons/fi';

const ALL_COLUMNS = [
  { key: 'Guid', header: 'CODE', sortable: true },
  { key: 'QuotationNumber', header: 'QUOTATION NO.', sortable: true },
  { key: 'Description', header: 'DESCRIPTION', sortable: true },
  { key: 'SalesType', header: 'TYPE', sortable: true },
  { key: 'Date', header: 'DATE', sortable: true },
  { key: 'ValidUntil', header: 'VALID', sortable: true },
  { key: 'Status', header: 'STATUS', sortable: true, render: (item) => <StatusBadge status={item.Status} /> },
];

function StatsSection() {
  return (
    <div className={styles.statsGrid}>
      <StatsCard number="15" label="Total Quotation" change="+8" isPositive />
      <StatsCard number="7" label="Valid" change="+8" isPositive />
      <StatsCard number="8" label="Expired" change="-8" isPositive={false} />
    </div>
  );
}

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
    { key: 'Guid', header: 'CODE', sortable: true },
    { key: 'QuotationNumber', header: 'QUOTATION NO.', sortable: true },
    { key: 'Description', header: 'DESCRIPTION', sortable: true },
    { key: 'SalesType', header: 'TYPE', sortable: true },
    { key: 'Date', header: 'DATE', sortable: true },
    { key: 'ValidUntil', header: 'VALID', sortable: true },
    { key: 'Status', header: 'STATUS', sortable: true, render: (item) => <StatusBadge status={item.Status} /> },
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
