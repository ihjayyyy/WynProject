'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiFileText } from 'react-icons/fi';
import Button from '../../ui/Button/Button';
import Breadcrumbs from '../../ui/Breadcrumbs/Breadcrumbs';
import ProposalMaterialsTable from './ProposalMaterialsTable';
import {
  sampleProposals,
  sampleProposalScopes,
} from '../proposalData';
import styles from './ProposalMaterialsPage.module.scss';

const summaryFields = [
  { key: 'id', label: 'ProposalScope Id' },
  { key: 'proposalId', label: 'Proposal Id' },
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'percentage', label: 'Percentage' },
  { key: 'scopeOfWork', label: 'ScopeOfWork' },
];

const proposalSummaryFields = [
  { key: 'id', label: 'Proposal Id' },
  { key: 'inquiryId', label: 'Inquiry Id' },
  { key: 'proposalNumber', label: 'Proposal Number' },
  { key: 'proposalTotal', label: 'Proposal Total' },
  { key: 'projectName', label: 'Project Name' },
  { key: 'location', label: 'Location' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'companyName', label: 'Company Name' },
  { key: 'email', label: 'Email' },
];

export default function ProposalMaterialsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalScopeId = searchParams.get('proposalScopeId');

  const proposalScope = useMemo(
    () => sampleProposalScopes.find((item) => item.id === proposalScopeId),
    [proposalScopeId]
  );

  const proposal = useMemo(() => {
    if (!proposalScope?.proposalId) {
      return null;
    }
    return sampleProposals.find((item) => item.id === proposalScope.proposalId) || null;
  }, [proposalScope]);

  if (!proposalScopeId || !proposalScope) {
    return (
      <div className={styles.pageWrap}>
        <Breadcrumbs
          showBack
          backIcon={<FiFileText />}
          items={[{ label: 'Proposal Details' }, { label: 'Proposal Materials' }]}
        />
        <h2 className={styles.title}>Proposal Materials</h2>
        <p className={styles.emptyState}>ProposalScope not found.</p>
        <Button variant="secondary" onClick={() => router.push('/proposal')}>Back to Proposal</Button>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <Breadcrumbs
        showBack
        backIcon={<FiFileText />}
        items={[
          {
            label: 'Proposal Details',
            href: proposal?.id ? `/proposal/proposalform?id=${proposal.id}` : `/proposal/proposalform?id=${proposalScope.proposalId}`,
          },
          { label: 'Proposal Materials' },
        ]}
      />

      <section className={styles.summarySection}>
        <h3 className={styles.summaryTitle}>Proposal Details</h3>
        {proposal ? (
          <div className={styles.summaryGrid}>
            {proposalSummaryFields.map((field) => (
              <div key={field.key} className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{field.label}</span>
                <span className={styles.summaryValue}>{proposal[field.key] || '—'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>Proposal not found.</p>
        )}
      </section>

      <section className={styles.summarySection}>
        <h3 className={styles.summaryTitle}>ProposalScope Details</h3>
        <div className={styles.summaryGrid}>
          {summaryFields.map((field) => (
            <div
              key={field.key}
              className={`${styles.summaryItem} ${field.key === 'scopeOfWork' ? styles.fullWidth : ''}`}>
              <span className={styles.summaryLabel}>{field.label}</span>
              <span className={styles.summaryValue}>{proposalScope[field.key] || '—'}</span>
            </div>
          ))}
        </div>
      </section>

      <ProposalMaterialsTable proposalScopeId={proposalScope.id} />
    </div>
  );
}
