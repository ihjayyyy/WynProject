  'use client';

import React, { useEffect, useState } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import SalesBillingService from '@/services/SalesBilling';
import styles from './ProjectScope.module.scss';
import detailsStyles from './ProjectDetails.module.scss';

const billingColumns = [
  { header: 'Billing No.', key: 'salesBillingNo' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Description', key: 'description' },
  { header: 'Billing Type', key: 'billingType' },
  { header: 'Status', key: 'status', render: (item) => <StatusBadge status={item.status} /> },
  { header: 'Amount', key: 'amount', render: (item) => Number(item.amount || 0).toLocaleString() },
  { header: 'Balance', key: 'balance', render: (item) => Number(item.balance || 0).toLocaleString() },
  { header: 'Payment Status', key: 'paymentStatus' },
];

const SUB_TABS = ['Billing', 'Collection'];

export default function ProjectBillingCollectionTab({ projectId = 0 }) {
  const [billings, setBillings] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('Billing');

  useEffect(() => {
    if (!projectId) return;
    SalesBillingService.getSalesBillingByProjectId(projectId).then(({ data }) => {
      if (Array.isArray(data)) setBillings(data);
      else if (data) setBillings([data]);
    });
  }, [projectId]);

  return (
    <div className={styles.tabContent}>
      <div className={detailsStyles.tabs} style={{ marginBottom: 16 }}>
        {SUB_TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`${detailsStyles.tab} ${activeSubTab === t ? detailsStyles.tabActive : ''}`}
            onClick={() => setActiveSubTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

    {activeSubTab === 'Billing' && (
        <>
            <div className={styles.headerRow}>
            <h2 className={styles.title}>Billings</h2>
            </div>

            <DataTable
            columns={billingColumns}
            data={billings}
            emptyMessage="No billings found"
            />
        </>
    )}

      {activeSubTab === 'Collection' && (
        <>
            <div className={styles.headerRow}>
                <h2 className={styles.title}>Collections</h2>
            </div>
            <div className={styles.emptyState || ''} style={{ padding: 24, textAlign: 'center' }}>
            Collection content is not available yet.
            </div>
        </>
      )}
    </div>
  );
}
