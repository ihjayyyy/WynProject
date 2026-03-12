'use client';

import React, { useMemo, useState } from 'react';
import SearchBar from '../SearchBar/SearchBar';
import DataTable from '../DataTable/DataTable';
import StatsCard from '../StatsCard/StatsCard';
import styles from './Landing.module.scss';

export default function Landing({
  title,
  data = [],
  columns = [],
  stats = [],
  searchPlaceholder = 'Search',
  newButtonLabel,
  onNew,
  emptyMessage = 'No records found',
  width = '320px',
  filterFn,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const k = (searchTerm || '').trim().toLowerCase();
    if (!k) return data;
    if (typeof filterFn === 'function') return data.filter((d) => filterFn(d, k));

    return data.filter((item) =>
      Object.values(item)
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k))
    );
  }, [searchTerm, data, filterFn]);

  const statsGridStyle = useMemo(() => {
    const count = Math.min(Math.max((stats || []).length, 1), 4);
    const cols = count === 1 ? '1fr' : `repeat(${count}, minmax(0, 1fr))`;
    return { gridTemplateColumns: cols };
  }, [stats]);

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{title}</h1>

        <div className={styles.headerActions}>
          <SearchBar
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton={Boolean(newButtonLabel)}
            buttonLabel={newButtonLabel}
            handleOnClick={onNew}
            width={width}
          />
        </div>
      </div>

      <div className={styles.statsSection} style={statsGridStyle}>
        {stats.map((s) => (
          <StatsCard key={s.key} number={s.number} label={s.label} change={s.change} isPositive={s.isPositive} />
        ))}
      </div>

      <div className={styles.tableSection}>
        <DataTable columns={columns} data={filtered} showActions={false} emptyMessage={emptyMessage} />
      </div>
    </div>
  );
}
