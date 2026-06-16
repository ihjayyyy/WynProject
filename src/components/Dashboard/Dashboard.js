'use client';

import React from 'react';
import Link from 'next/link';
import StatsCard from '../ui/StatsCard/StatsCard';
import { getColumnsForModule } from './dashboardColumns';
import {
  getUserModules,
  getAllDashboardCards,
  getAllForApproval,
  getAllNeedsAttention,
} from './DashboardModels';

import styles from './Dashboard.module.scss';

const MODULE_PATH_REGISTRY = {
  'Projects.Projects': '/projects/project',
};

function moduleToPath(moduleName) {
  if (MODULE_PATH_REGISTRY[moduleName]) return MODULE_PATH_REGISTRY[moduleName];
  return '/' + moduleName.replace(/\./g, '/').toLowerCase();
}

function moduleDisplayName(moduleName) {
  const parts = moduleName.split('.');
  return parts[parts.length - 1];
}

const ROW_HEIGHT = 37;
const MAX_VISIBLE_ROWS = 5;

function SimpleTable({ moduleName, data }) {
  const columns = getColumnsForModule(moduleName, data);

  if (!data || data.length === 0) {
    return <p className={styles.tableMessage}>No records found.</p>;
  }

  const isScrollable = data.length > MAX_VISIBLE_ROWS;

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles.th}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
      </table>
      <div
        className={styles.tableBodyWrapper}
        style={isScrollable ? { maxHeight: ROW_HEIGHT * MAX_VISIBLE_ROWS } : undefined}
      >
        <table className={styles.table}>
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} />
            ))}
          </colgroup>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id ?? i} className={styles.tr}>
                {columns.map((col) => (
                  <td key={col.key} className={styles.td}>
                    {col.render ? col.render(row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModuleBlock({ moduleName, items, error }) {
  const viewPath = moduleToPath(moduleName);
  const count = items?.length ?? 0;

  return (
    <div className={styles.moduleBlock}>
      <div className={styles.moduleBlockHeader}>
        <div className={styles.moduleLabelGroup}>
          <span className={styles.moduleLabel}>
            {moduleDisplayName(moduleName)}
          </span>
          <span className={styles.moduleCount}>{count}</span>
        </div>
        <Link href={viewPath} className={styles.viewBtn}>
          View ↗
        </Link>
      </div>
      {error ? (
        <p className={styles.tableError}>{error}</p>
      ) : (
        <SimpleTable moduleName={moduleName} data={items} />
      )}
    </div>
  );
}

function ListPanel({ title, moduleMap }) {
  const visibleEntries = Object.entries(moduleMap).filter(
    ([, { data }]) => data.length > 0
  );

  return (
    <div className={styles.listPanel}>
      <h3 className={styles.listPanelTitle}>{title}</h3>
      {visibleEntries.length === 0 ? (
        <p className={styles.message}>No records found.</p>
      ) : (
        visibleEntries.map(([moduleName, { data, error }]) => (
          <ModuleBlock
            key={moduleName}
            moduleName={moduleName}
            items={data}
            error={error}
          />
        ))
      )}
    </div>
  );
}

function SkeletonListsGrid() {
  return (
    <div className={styles.listsGrid}>
      {['For Approval', 'Needs Attention'].map((title) => (
        <div key={title} className={styles.listPanel}>
          <h3 className={styles.listPanelTitle}>{title}</h3>
          <div className={styles.skeletonModuleBlock}>
            <div className={styles.skeletonModuleHeader} />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
          <div className={styles.skeletonModuleBlock}>
            <div className={styles.skeletonModuleHeader} />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCards({ count = 4 }) {
  return (
    <div className={styles.statsGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [modules, setModules] = React.useState([]);
  const [allModules, setAllModules] = React.useState([]);
  const [loadingModules, setLoadingModules] = React.useState(true);

  const [stats, setStats] = React.useState([]);
  const [statsLoading, setStatsLoading] = React.useState(true);

  const [forApprovalMap, setForApprovalMap] = React.useState(null);
  const [needsAttentionMap, setNeedsAttentionMap] = React.useState(null);
  const [listsReady, setListsReady] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getUserModules();
      if (!mounted) return;
      setModules(res.modules);
      setAllModules(res.allModules);
      setLoadingModules(false);
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    if (loadingModules || allModules.length === 0) return;
    let mounted = true;

    (async () => {
      const [statsRes, approvalRes, attentionRes] = await Promise.all([
        getAllDashboardCards(modules),
        getAllForApproval(allModules),
        getAllNeedsAttention(allModules),
      ]);

      if (!mounted) return;

      const allCards = Object.values(statsRes).flatMap((m) => m.data ?? []);
      setStats(allCards);
      setStatsLoading(false);

      setForApprovalMap(
        Object.fromEntries(
          allModules.map((m) => [
            m,
            {
              data: approvalRes[m]?.data ?? [],
              loading: false,
              error: approvalRes[m]?.error ?? '',
            },
          ])
        )
      );

      setNeedsAttentionMap(
        Object.fromEntries(
          allModules.map((m) => [
            m,
            {
              data: attentionRes[m]?.data ?? [],
              loading: false,
              error: attentionRes[m]?.error ?? '',
            },
          ])
        )
      );

      setListsReady(true);
    })();

    return () => { mounted = false; };
  }, [loadingModules, allModules]);

  return (
    <div className={styles.dashboardWrap}>
      <h1 className={styles.title}>Dashboard</h1>

      {statsLoading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className={styles.statsGrid}>
          {stats.map((item) => (
            <StatsCard key={item.id} {...item} />
          ))}
        </div>
      )}

      {!listsReady ? (
        <SkeletonListsGrid />
      ) : (
        <div className={styles.listsGrid}>
          <ListPanel title="For Approval" moduleMap={forApprovalMap} />
          <ListPanel title="Needs Attention" moduleMap={needsAttentionMap} />
        </div>
      )}
    </div>
  );
}