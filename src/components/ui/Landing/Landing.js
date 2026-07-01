'use client';

import React, { useMemo, useState } from 'react';
import SearchBar from '../SearchBar/SearchBar';
import DataTable from '../DataTable/DataTable';
import StatsCard from '../StatsCard/StatsCard';
import Select from '../Select/Select';
import Button from '../Button/Button';
import styles from './Landing.module.scss';

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const getFilterValue = (filter, filterValues) => {
  if (filterValues && Object.prototype.hasOwnProperty.call(filterValues, filter.key)) {
    return filterValues[filter.key];
  }
  return filter.value ?? '';
};

const defaultFilterPredicate = (item, filter, activeValue) => {
  const itemValue = typeof filter.accessor === 'function' ? filter.accessor(item) : item?.[filter.key];

  if (filter.type === 'date') {
    const itemDate = toDate(itemValue);
    if (!itemDate) return false;

    if (filter.match === 'date-gte') {
      const fromDate = toDate(`${activeValue}T00:00:00`);
      return fromDate ? itemDate >= fromDate : true;
    }

    if (filter.match === 'date-lte') {
      const toDateValue = toDate(`${activeValue}T23:59:59`);
      return toDateValue ? itemDate <= toDateValue : true;
    }
  }

  if (filter.match === 'equals') {
    return normalizeText(itemValue) === normalizeText(activeValue);
  }

  return normalizeText(itemValue).includes(normalizeText(activeValue));
};

export function applyLandingFilters(data = [], filters = [], filterValues = {}) {
  if (!Array.isArray(data) || !Array.isArray(filters) || filters.length === 0) return Array.isArray(data) ? data : [];

  return data.filter((item) => {
    for (const filter of filters) {
      const activeValue = getFilterValue(filter, filterValues);
      const hasValue = !(activeValue === null || activeValue === undefined || String(activeValue).trim() === '');
      if (!hasValue) continue;

      const predicate = typeof filter.predicate === 'function' ? filter.predicate : (entry, value) => defaultFilterPredicate(entry, filter, value);
      if (!predicate(item, activeValue, filterValues)) return false;
    }
    return true;
  });
}

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
  headerAddon,
  belowStatsAddon,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  hasActiveFilters = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filterableData = useMemo(() => applyLandingFilters(data, filters, filterValues), [data, filters, filterValues]);

  const filtered = useMemo(() => {
    const k = (searchTerm || '').trim().toLowerCase();
    if (!k) return filterableData;
    if (typeof filterFn === 'function') return filterableData.filter((d) => filterFn(d, k));

    return filterableData.filter((item) =>
      Object.values(item)
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k))
    );
  }, [searchTerm, filterableData, filterFn]);

  const statsGridStyle = useMemo(() => {
    const count = Math.min(Math.max((stats || []).length, 1), 4);
    const cols = count === 1 ? '1fr' : `repeat(${count}, minmax(0, 1fr))`;
    return { gridTemplateColumns: cols };
  }, [stats]);

  const hasSchemaFilters = Array.isArray(filters) && filters.length > 0;

  const generatedFilters = hasSchemaFilters ? (
    <div className={styles.dynamicFiltersWrap}>
      {filters.map((filter) => {
        const value = getFilterValue(filter, filterValues);
        const controlId = `${title || 'landing'}-${filter.key}-filter`;

        return (
          <div key={filter.key} className={styles.filterGroup}>
            {filter.label ? (
              <label htmlFor={controlId} className={styles.filterLabel}>
                {filter.label}
              </label>
            ) : null}

            {filter.type === 'select' ? (
              <Select
                id={controlId}
                value={value}
                onChange={(event) => onFilterChange?.(filter.key, event.target.value)}
                options={Array.isArray(filter.options) ? filter.options : []}
                placeholder={filter.placeholder || 'Select'}
                className={styles.filterSelect}
              />
            ) : (
              <input
                id={controlId}
                type={filter.type || 'text'}
                value={value}
                placeholder={filter.placeholder || ''}
                onChange={(event) => onFilterChange?.(filter.key, event.target.value)}
                min={filter.min}
                max={filter.max}
                className={filter.type === 'date' ? styles.filterDateInput : styles.filterTextInput}
              />
            )}
          </div>
        );
      })}

      {onClearFilters ? (
        <div className={styles.filterActions}>
          <Button variant='secondary' onClick={onClearFilters} disabled={!hasActiveFilters}>
            Clear Filters
          </Button>
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{title}</h1>

        <div className={styles.headerActions}>
          {headerAddon ? <div className={styles.headerAddon}>{headerAddon}</div> : null}
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

      {generatedFilters ? <div className={styles.belowStatsAddon}>{generatedFilters}</div> : null}
      {belowStatsAddon ? <div className={styles.belowStatsAddon}>{belowStatsAddon}</div> : null}

      <div className={styles.tableSection}>
        <DataTable columns={columns} data={filtered} showActions={false} emptyMessage={emptyMessage} />
      </div>
    </div>
  );
}
