import React from 'react';
import { useRouter } from 'next/navigation';
import StatsCard from '../ui/StatsCard/StatsCard';
import DataTable from '../ui/DataTable/DataTable';
import styles from './Dashboard.module.scss';
import { AccessContext } from '@/app/contextProviders/accessContext';
import {
  DASHBOARD_MODULES,
  getDashboardPreviewItems,
} from './DashboardModels';

export default function Dashboard() {
  const router = useRouter();
  const { isAllowed } = React.useContext(AccessContext);
  const [moduleData, setModuleData] = React.useState(() =>
    DASHBOARD_MODULES.reduce((acc, module) => {
      acc[module.key] = [];
      return acc;
    }, {})
  );

  const visibleModules = React.useMemo(
    () =>
      DASHBOARD_MODULES.filter(
        (module) => !module.accessCode || isAllowed(module.accessCode, 'r')
      ),
    [isAllowed]
  );

  const loadDashboardData = React.useCallback(async () => {
    const results = await Promise.all(
      visibleModules.map(async (module) => {
        const res = await module.fetcher();
        const items = Array.isArray(res?.data) ? res.data : [];
        return [module.key, items];
      })
    );

    setModuleData((prev) => ({ ...prev, ...Object.fromEntries(results) }));
  }, [visibleModules]);

  React.useEffect(() => {
    if (!visibleModules.length) return;
    loadDashboardData();
  }, [loadDashboardData, visibleModules]);

  return (
    <div className={styles.dashboardWrap}>
      <h1 className={styles.title}>Dashboard</h1>

      {visibleModules.map((module) => {
        const items = moduleData[module.key] || [];
        const stats = module.buildStats(items);
        const previewItems = getDashboardPreviewItems(items);

        return (
          <section className={styles.sectionBlock} key={module.key}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{module.title}</h2>
              <button
                type="button"
                className={styles.redirectBtn}
                onClick={() => router.push(module.redirectPath)}
              >
                {module.redirectLabel}
              </button>
            </div>

            <div className={styles.statsGrid}>
              {stats.map((stat, idx) => (
                <StatsCard
                  key={`${module.key}-stat-${idx}`}
                  number={stat.number}
                  label={stat.label}
                  change={stat.change}
                  isPositive={stat.isPositive}
                />
              ))}
            </div>

            <div className={styles.tableSection}>
              <DataTable
                data={previewItems}
                columns={module.columns}
                showActions={false}
                pagination={false}
                emptyMessage={module.emptyMessage}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
