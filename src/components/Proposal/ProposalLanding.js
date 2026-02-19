'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import SearchBar from '../ui/SearchBar/SearchBar';
import DataTable from '../ui/DataTable/DataTable';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import StatsCard from '../ui/StatsCard/StatsCard';
import { sampleProposals } from './proposalData';
import styles from './ProposalLanding.module.scss';

const baseColumns = [
  { header: 'Proposal Number', key: 'proposalNumber' },
  { header: 'Project Name', key: 'projectName' },
  { header: 'Customer Name', key: 'customerName' },
  { header: 'Proposal Total', key: 'proposalTotal' },
  { header: 'Location', key: 'location' },
  { header: 'Created Date', key: 'createdDate' },
  { header: 'Code', key: 'code' },
  { header: 'Name', key: 'name' },
];

export default function ProposalLanding() {
  const [searchTerm, setSearchTerm] = useState('');
  const [proposals] = useState(sampleProposals);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) => router.push(`/proposal/proposalform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/proposal/proposalform?id=${item.id}&mode=edit`),
      },
    ],
    [router]
  );

  const columns = useMemo(
    () => [
      ...baseColumns,
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        render: (item) => <DropdownAction item={item} items={actionItems} />,
      },
    ],
    [actionItems]
  );

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
    const total = proposals.length;
    const totalValue = proposals.reduce((sum, item) => sum + Number(item.proposalTotal || 0), 0);
    const averageValue = total ? totalValue / total : 0;
    const uniqueCustomers = new Set(proposals.map((item) => item.customerName).filter(Boolean)).size;

    const formatAmount = (value) =>
      new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
      }).format(value);

    return [
      {
        key: 'total',
        label: 'Total Proposals',
        number: total,
        change: `${total} records`,
        isPositive: true,
      },
      {
        key: 'totalValue',
        label: 'Total Value',
        number: formatAmount(totalValue),
        change: 'Combined amount',
        isPositive: true,
      },
      {
        key: 'avgValue',
        label: 'Average Value',
        number: formatAmount(averageValue),
        change: 'Per proposal',
        isPositive: true,
      },
      {
        key: 'customers',
        label: 'Customers',
        number: uniqueCustomers,
        change: `${uniqueCustomers} unique`,
        isPositive: true,
      },
    ];
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
