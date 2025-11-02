import React, { useState } from 'react';
import Select from '../ui/Select/Select';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';
import styles from './RightPanel.module.scss';

/**
 * Dynamic RightPanel component for all landing pages.
 *
 * Props:
 * - allColumns: array of column objects { key, header }
 * - selectedColumns: array of selected column keys
 * - setSelectedColumns: function to update selected columns
 * - filter: filter object (from parent state)
 * - onFilterChange: function to update filter
 * - filterConfig: {
 *     label: string (e.g. 'Purchase Type'),
 *     key: string (e.g. 'purchaseType'),
 *     options: array of { value, label }
 *   }
 * - OR filterConfigs: array of the above to render multiple filter controls
 */
function RightPanel({
  allColumns,
  selectedColumns,
  setSelectedColumns,
  filter,
  onFilterChange,
  // support both single config for backward compatibility and array of configs
  filterConfig = { label: '', key: '', options: [] },
  filterConfigs = null,
}) {
  const [expanded, setExpanded] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(true);

  // normalize to array of configs
  const configs = filterConfigs && Array.isArray(filterConfigs)
    ? filterConfigs
    : filterConfig && filterConfig.label
    ? [filterConfig]
    : [];

  const handleColumnToggle = (columnKey, isChecked) => {
    if (isChecked) {
      setSelectedColumns((prev) => [...prev, columnKey]);
    } else {
      setSelectedColumns((prev) => prev.filter((k) => k !== columnKey));
    }
  };

  const handleSelectAll = () => {
    // Treat any column whose key lower-cased equals 'actions' as the action column.
    const actionKeys = selectedColumns.filter((k) => String(k).toLowerCase() === 'actions');
    const selectedWithoutAction = selectedColumns.filter((k) => String(k).toLowerCase() !== 'actions');

    if (selectedWithoutAction.length === allColumns.length) {
      // Deselect all but preserve action keys (actions should remain visible)
      setSelectedColumns(actionKeys);
    } else {
      // Select all available columns and preserve any action keys that existed
      const allKeys = allColumns.map((col) => col.key);
      const merged = Array.from(new Set([...allKeys, ...actionKeys]));
      setSelectedColumns(merged);
    }
  };

  // Compute counts while excluding action column(s) from the math so the UI
  // shows e.g. 7/7 instead of 8/7 when 'Actions' is always present in
  // selectedColumns.
  const selectedWithoutAction = selectedColumns.filter((k) => String(k).toLowerCase() !== 'actions');
  const isAllSelected = selectedWithoutAction.length === allColumns.length;
  const isIndeterminate = selectedWithoutAction.length > 0 && selectedWithoutAction.length < allColumns.length;

  return (
    <div className={styles.rightPanel}>
      {/* Filter Section */}
      {configs.length > 0 && (
        <>
          <div className={styles.panelHeader}>
            <div className={styles.headerContent}>
              <h3
                className={styles.panelTitle}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={() => setFilterExpanded((exp) => !exp)}>
                Filter
              </h3>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {filterExpanded ? (
                  <FiChevronUp size={20} />
                ) : (
                  <FiChevronDown size={20} />
                )}
              </div>
            </div>
          </div>

          {filterExpanded && (
            <div className={styles.panelContent}>
              <div className={styles.filterSection}>
                {configs.map((cfg) => (
                  <label key={cfg.key} className={styles.filterLabel}>
                    <span className={styles.filterLabelText}>{cfg.label}</span>
                    <Select
                      id={cfg.key + 'Filter'}
                      value={filter?.[cfg.key] || ''}
                      onChange={(e) => {
                        if (onFilterChange) {
                          onFilterChange({ ...filter, [cfg.key]: e.target.value });
                        }
                      }}
                      options={cfg.options}
                      label={null}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Columns Section */}
      <div className={styles.panelHeader}>
        <div className={styles.headerContent}>
          <h3
            className={styles.panelTitle}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            onClick={() => setExpanded((exp) => !exp)}>
            Columns
            <span className={styles.columnCount}>
              {selectedWithoutAction.length}/{allColumns.length}
            </span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {expanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className={styles.panelContent}>
          <div className={styles.selectAllSection}>
            <label
              className={`${styles.checkboxLabel} ${styles.selectAllLabel}`}>
              <div className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                />
                <div className={styles.checkboxCustom}>
                  {isAllSelected && (
                    <svg
                      className={styles.checkIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                  {isIndeterminate && (
                    <svg
                      className={styles.minusIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`${styles.labelText} ${styles.selectAllText}`}>
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.columnsList}>
            {allColumns.map((col) => (
              <label
                key={col.key}
                className={`${styles.checkboxLabel} ${styles.columnLabel}`}>
                <div className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={selectedColumns.includes(col.key)}
                    onChange={(e) =>
                      handleColumnToggle(col.key, e.target.checked)
                    }
                  />
                  <div className={styles.checkboxCustom}>
                    {selectedColumns.includes(col.key) && (
                      <svg
                        className={styles.checkIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={styles.labelText}>{col.header}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RightPanel;
