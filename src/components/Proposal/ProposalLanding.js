'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import { FiEye, FiEdit2 } from 'react-icons/fi';
import StatsCard from '../ui/StatsCard/StatsCard';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import StatusBadge from '../ui/StatusBadge/StatusBadge';
import { sampleProposals } from './proposalData';
import styles from './ProposalLanding.module.scss';

const baseColumns = [
  { header: 'Date', key: 'createdDate' },
  { header: 'Proposal Number', key: 'proposalNumber' },
  { header: 'Customer Name', key: 'customerName' },
  { header: 'Proposal Total', key: 'proposalTotal' },
  { header: 'Status', key: 'status' },
];

export default function ProposalLanding() {
  const [searchTerm, setSearchTerm] = useState('');
  const [proposals] = useState(sampleProposals);
  const router = useRouter();

  const columns = useMemo(() => {
    const cols = baseColumns.map((col) => {
      if (col.key === 'status') {
        return {
          ...col,
          render: (item) => <StatusBadge status={item.status} />,
        };
      }

      return col;
    });

    cols.push({
      header: 'Action',
      key: 'action',
      align: 'right',
      render: (item) => {
        const items = [
          {
            key: 'view',
            label: 'View',
            icon: <FiEye size={14} />,
            onClick: () => router.push(`/proposal/proposalform?id=${item.id}`),
          },
        ];

        const statusRaw = String(item.status || '').toLowerCase();
        const normalized = statusRaw.replace(/\s+/g, '');
        const locked = normalized === 'approved' || normalized === 'forapproval';

        if (!locked) {
          items.push({
            key: 'edit',
            label: 'Edit',
            icon: <FiEdit2 size={14} />,
            onClick: () => router.push(`/proposal/proposalform?id=${item.id}&mode=edit`),
          });
        }

        return <DropdownAction item={item} items={items} />;
      },
    });

    return cols;
  }, [router]);

  const filteredProposals = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return proposals;
    }

    return proposals.filter((item) =>
      [
        item.inquiryId,
        item.proposalNumber,
        item.proposalTotal,
        item.location,
        item.projectName,
        item.id,
        item.createdBy,
        item.createdDate,
        item.updatedBy,
        item.updatedDate,
        item.code,
        item.name,
        item.customerName,
        item.contactNumber,
        item.address,
        item.companyName,
        item.email,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [searchTerm, proposals]);

  const proposalStats = useMemo(() => {
    const statuses = ['Draft', 'Approved', 'forApproval'];

    const stats = statuses.map((s) => {
      const count = proposals.filter(
        (p) => (p.status || '').toString().toLowerCase() === s.toLowerCase()
      ).length;

      return {
        key: s.toLowerCase(),
        label: s === 'forApproval' ? 'For Approval' : s,
        number: count,
        change: `${count} proposals`,
        isPositive: true,
      };
    });

    return stats;
  }, [proposals]);

  return (
    <div className={styles.proposalWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Proposal</h1>

        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search proposal"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="New Proposal"
            handleOnClick={() => router.push('/proposal/proposalform')}
            width="320px"
          />
        </div>
      </div>

      <div className={styles.statsSection}>
        {proposalStats.map((stat) => (
          <StatsCard
            key={stat.key}
            number={stat.number}
            label={stat.label}
            change={stat.change}
            isPositive={stat.isPositive}
          />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable
          columns={columns}
          data={filteredProposals}
          showActions={false}
          emptyMessage="No proposals found"
        />
      </div>
    </div>
  );
}
