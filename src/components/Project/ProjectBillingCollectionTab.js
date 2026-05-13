  'use client';

import React, { useEffect, useState } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import SalesBillingService from '@/services/SalesBilling';
import styles from './ProjectScope.module.scss';

const billingColumns = [
  { header: 'Billing No.', key: 'salesBillingNo' },
  { header: 'Description', key: 'description' },
  { header: 'Billing Type', key: 'billingType' },
  { header: 'Total Amount Paid', key: 'totalAmountPaid', render: (item) => Number(item.totalAmountPaid || 0).toLocaleString() },
  { header: 'Collection No.', key: 'collectionNo' },
  { header: 'Receipt No.', key: 'receiptNo' },
  { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
  { header: 'Amount', key: 'amount', render: (item) => Number(item.amount || 0).toLocaleString() },
  { header: 'Balance', key: 'balance', render: (item) => Number(item.balance || 0).toLocaleString() },
  { header: 'Payment Status', key: 'paymentStatus', render: (item) => <StatusBadge status={item.paymentStatus} /> },
];

export default function ProjectBillingCollectionTab({ projectId = 0 }) {
  const [billings, setBillings] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    SalesBillingService.getSalesBillingByProjectId(projectId).then(({ data }) => {
      if (Array.isArray(data)) setBillings(data);
      else if (data) setBillings([data]);
    });
  }, [projectId]);

  return (
    <div className={styles.tabContent}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Billing and Collection</h2>
      </div>

      <DataTable
        columns={billingColumns}
        data={billings}
        emptyMessage="No billings found"
        showActions={false}
      />
    </div>
  );
}
