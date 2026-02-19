'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye, FiLayers } from 'react-icons/fi';
import SearchBar from '../../ui/SearchBar/SearchBar';
import DataTable from '../../ui/DataTable/DataTable';
import StatsCard from '../../ui/StatsCard/StatsCard';
import DropdownAction from '../../ui/DropdownAction/DropdownAction';
import { sampleProposalScopes } from '../proposalData';
import styles from './ProposalScopeTable.module.scss';

export default function ProposalScopeTable({ proposalId, proposalNumber, projectName }) {
  const router = useRouter();
  const [scopeSearchTerm, setScopeSearchTerm] = useState('');

  const proposalScopes = useMemo(() => {
    if (!proposalId) {
      return [];
    }

    return sampleProposalScopes.filter((item) => item.proposalId === proposalId);
  }, [proposalId]);

  const scopeActionItems = useMemo(
    () => [
      {
        key: 'view',
        label: 'View',
        icon: <FiEye size={14} />,
        onClick: (item) => router.push(`/proposal/proposalscopeform?id=${item.id}`),
      },
      {
        key: 'edit',
        label: 'Edit',
        icon: <FiEdit2 size={14} />,
        onClick: (item) => router.push(`/proposal/proposalscopeform?id=${item.id}&mode=edit`),
      },
      {
        key: 'materials',
        label: 'View Materials',
        icon: <FiLayers size={14} />,
        onClick: (item) => router.push(`/proposal/proposalmaterials?proposalScopeId=${item.id}`),
      },
    ],
    [router]
  );

  const proposalScopeColumns = useMemo(
    () => [
      { header: 'Id', key: 'id' },
      { header: 'Code', key: 'code' },
      { header: 'Name', key: 'name' },
      { header: 'ForecastedStartDate', key: 'forecastedStartDate' },
      { header: 'ForecastedEndDate', key: 'forecastedEndDate' },
      { header: 'ActualStartDate', key: 'actualStartDate' },
      { header: 'ActualEndDate', key: 'actualEndDate' },
      { header: 'Percentage', key: 'percentage' },
      {
        header: 'Action',
        key: 'actions',
        align: 'right',
        render: (item) => <DropdownAction item={item} items={scopeActionItems} />,
      },
    ],
    [scopeActionItems]
  );

  const filteredProposalScopes = useMemo(() => {
    const keyword = scopeSearchTerm.trim().toLowerCase();

    if (!keyword) {
      return proposalScopes;
    }

    return proposalScopes.filter((item) =>
      [
        item.id,
        item.createdBy,
        item.createdDate,
        item.updatedBy,
        item.updatedDate,
        item.code,
        item.name,
        item.proposalId,
        item.forecastedStartDate,
        item.forecastedEndDate,
        item.actualStartDate,
        item.actualEndDate,
        item.scopeOfWork,
        item.percentage,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [proposalScopes, scopeSearchTerm]);

  const scopeStats = useMemo(() => {
    const total = proposalScopes.length;
    const totalPercentage = proposalScopes.reduce((sum, item) => sum + Number(item.percentage || 0), 0);
    const averagePercentage = total ? Math.round(totalPercentage / total) : 0;

    return [
      {
        key: 'total',
        label: 'Total Scopes',
        number: total,
        change: `${total} records`,
        isPositive: true,
      },
      {
        key: 'totalPercentage',
        label: 'Total Percentage',
        number: `${totalPercentage}%`,
        change: 'Combined',
        isPositive: true,
      },
      {
        key: 'averagePercentage',
        label: 'Average Percentage',
        number: `${averagePercentage}%`,
        change: 'Per scope',
        isPositive: true,
      },
      {
        key: 'proposal',
        label: 'Proposal',
        number: proposalNumber || '—',
        change: projectName || 'Scope listing',
        isPositive: true,
      },
    ];
  }, [proposalScopes, proposalNumber, projectName]);

  if (!proposalId) {
    return null;
  }

  return (
    <section className={styles.scopeSection}>
      <div className={styles.scopeHeaderRow}>
        <h3 className={styles.scopeTitle}>ProposalScope</h3>
        <SearchBar
          placeholder="Search proposal scope"
          value={scopeSearchTerm}
          onChange={setScopeSearchTerm}
          showFilter={false}
          showButton
          buttonLabel="New ProposalScope"
          handleOnClick={() => router.push(`/proposal/proposalscopeform?proposalId=${proposalId}`)}
          width="320px"
        />
      </div>

      <div className={styles.statsSection}>
        {scopeStats.map((stat) => (
          <StatsCard
            key={stat.key}
            number={stat.number}
            label={stat.label}
            change={stat.change}
            isPositive={stat.isPositive}
          />
        ))}
      </div>

      <DataTable
        columns={proposalScopeColumns}
        data={filteredProposalScopes}
        showActions={false}
        emptyMessage="No proposal scopes found"
      />
    </section>
  );
}
