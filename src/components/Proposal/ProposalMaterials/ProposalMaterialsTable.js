'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../../ui/SearchBar/SearchBar';
import DataTable from '../../ui/DataTable/DataTable';
import StatsCard from '../../ui/StatsCard/StatsCard';
import { sampleProposalMaterials } from '../proposalData';
import styles from './ProposalMaterialsTable.module.scss';

const materialColumns = [
  { header: 'ProposalScopeId', key: 'proposalScopeId' },
  { header: 'AssemblyName', key: 'assemblyName' },
  { header: 'MaterialId', key: 'materialId' },
  { header: 'MaterialType', key: 'materialType' },
  { header: 'UOM', key: 'uom' },
  { header: 'Quantity', key: 'quantity' },
  { header: 'UnitCost', key: 'unitCost' },
  { header: 'TotalCost', key: 'totalCost' },
  { header: 'Margin', key: 'margin' },
  { header: 'ScopeOfWork', key: 'scopeOfWork' },
];

export default function ProposalMaterialsTable({ proposalScopeId }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const proposalMaterials = useMemo(() => {
    if (!proposalScopeId) {
      return [];
    }
    return sampleProposalMaterials.filter((item) => item.proposalScopeId === proposalScopeId);
  }, [proposalScopeId]);

  const filteredMaterials = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return proposalMaterials;
    }

    return proposalMaterials.filter((item) =>
      [
        item.proposalScopeId,
        item.assemblyName,
        item.materialId,
        item.materialType,
        item.uom,
        item.quantity,
        item.unitCost,
        item.totalCost,
        item.margin,
        item.scopeOfWork,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [proposalMaterials, searchTerm]);

  const materialStats = useMemo(() => {
    const totalMaterials = proposalMaterials.length;
    const totalQuantity = proposalMaterials.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    );
    const totalCost = proposalMaterials.reduce(
      (sum, item) => sum + Number(item.totalCost || 0),
      0
    );
    const averageMargin = totalMaterials
      ? proposalMaterials.reduce((sum, item) => sum + Number(String(item.margin || '0').replace('%', '')), 0) /
        totalMaterials
      : 0;

    const formatAmount = (value) =>
      new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
      }).format(value);

    return [
      {
        key: 'materials',
        label: 'Total Materials',
        number: totalMaterials,
        change: `${totalMaterials} items`,
        isPositive: true,
      },
      {
        key: 'quantity',
        label: 'Total Quantity',
        number: totalQuantity,
        change: 'Combined qty',
        isPositive: true,
      },
      {
        key: 'cost',
        label: 'Total Cost',
        number: formatAmount(totalCost),
        change: 'Material spend',
        isPositive: true,
      },
      {
        key: 'margin',
        label: 'Average Margin',
        number: `${Math.round(averageMargin)}%`,
        change: 'Across items',
        isPositive: true,
      },
    ];
  }, [proposalMaterials]);

  if (!proposalScopeId) {
    return null;
  }

  return (
    <section className={styles.materialSection}>
      <div className={styles.materialHeaderRow}>
        <h3 className={styles.materialTitle}>Proposal Materials</h3>
        <div className={styles.materialHeaderActions}>
          <SearchBar
            placeholder="Search materials"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="New Material"
            handleOnClick={() =>
              router.push(`/proposal/proposalmaterialsform?proposalScopeId=${proposalScopeId}`)
            }
            width="320px"
          />
        </div>
      </div>

      <div className={styles.statsSection}>
        {materialStats.map((stat) => (
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
        columns={materialColumns}
        data={filteredMaterials}
        showActions={false}
        emptyMessage="No proposal materials found"
      />
    </section>
  );
}
