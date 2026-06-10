'use client';

import React from 'react';
import Link from 'next/link';
import StatsCard from '../ui/StatsCard/StatsCard';
import DataTable from '../ui/DataTable/DataTable';
import { getColumnsForModule } from './dashboardColumns';

import {
  getUserModules,
  getAllDashboardCards,
  getAllForApproval,
  getAllNeedsAttention,
} from './DashboardModels';

import styles from './Dashboard.module.scss';

function moduleToPath(moduleName) {
  return '/' + moduleName.replace(/\./g, '/').toLowerCase();
}

function moduleDisplayName(moduleName) {
  const parts = moduleName.split('.');
  return parts[parts.length - 1];
}

function ModuleBlock({ moduleName, items, loading, error }) {
  const columns = getColumnsForModule(moduleName, items);
  const viewPath = moduleToPath(moduleName);

  return (
    <div className={styles.moduleBlock}>
      <div className={styles.moduleBlockHeader}>
        <span className={styles.moduleLabel}>
          {moduleDisplayName(moduleName)}
        </span>
        <Link href={viewPath} className={styles.viewBtn}>
          View ↗
        </Link>
      </div>

      <div className={styles.moduleTableWrap}>
        {loading && <p className={styles.tableMessage}>Loading...</p>}
        {!loading && error && (
          <p className={styles.tableError}>{error}</p>
        )}
        {!loading && !error && (
          <DataTable
            columns={columns}
            data={items}
            showActions={false}
            pagination={false}
            emptyMessage="No records found."
            className={styles.dashboardDataTable}
          />
        )}
      </div>
    </div>
  );
}

function ListPanel({ title, moduleMap, loadingModules }) {
  if (loadingModules) {
    return (
      <div className={styles.listPanel}>
        <h3 className={styles.listPanelTitle}>{title}</h3>
        <p className={styles.message}>Loading...</p>
      </div>
    );
  }

  // Only render modules that are still loading or have at least 1 record
  const visibleEntries = Object.entries(moduleMap).filter(
    ([, { data, loading }]) => loading || data.length > 0
  );

  if (visibleEntries.length === 0) {
    return (
      <div className={styles.listPanel}>
        <h3 className={styles.listPanelTitle}>{title}</h3>
        <p className={styles.message}>No records found.</p>
      </div>
    );
  }

  return (
    <div className={styles.listPanel}>
      <h3 className={styles.listPanelTitle}>{title}</h3>
      {visibleEntries.map(([moduleName, { data, loading, error }]) => (
        <ModuleBlock
          key={moduleName}
          moduleName={moduleName}
          items={data}
          loading={loading}
          error={error}
        />
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

  const [forApprovalMap, setForApprovalMap] = React.useState({});
  const [needsAttentionMap, setNeedsAttentionMap] = React.useState({});

  // ── Step 1: load modules ──────────────────────────────────────────────────
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

  // ── Step 2: seed loading placeholders once allModules is known ────────────
  React.useEffect(() => {
    if (loadingModules || allModules.length === 0) return;

    const seed = Object.fromEntries(
      allModules.map((m) => [m, { data: [], loading: true, error: '' }])
    );
    setForApprovalMap(seed);
    setNeedsAttentionMap(seed);
  }, [loadingModules, allModules]);

  // ── Step 3: fetch all data in parallel ────────────────────────────────────
  React.useEffect(() => {
    if (loadingModules || allModules.length === 0) return;

    let mounted = true;

    (async () => {
      const [statsRes, approvalRes, attentionRes] = await Promise.all([
        getAllDashboardCards(modules),      // leaf modules only
        getAllForApproval(allModules),      // full list
        getAllNeedsAttention(allModules),   // full list
      ]);

      if (!mounted) return;

      // Flatten all cards from all modules into one list
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
    })();

    return () => { mounted = false; };
  }, [loadingModules, allModules]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.dashboardWrap}>
      <h1 className={styles.title}>Dashboard</h1>

      {/* STATS */}
      {statsLoading ? (
        <p className={styles.message}>Loading...</p>
      ) : (
        <div className={styles.statsGrid}>
          {stats.map((item) => (
            <StatsCard key={item.id} {...item} />
          ))}
        </div>
      )}

      {/* TABLES */}
      <div className={styles.listsGrid}>
        <ListPanel
          title="For Approval"
          moduleMap={forApprovalMap}
          loadingModules={loadingModules}
        />
        <ListPanel
          title="Needs Attention"
          moduleMap={needsAttentionMap}
          loadingModules={loadingModules}
        />
      </div>
    </div>
  );
}