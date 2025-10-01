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
 */
function RightPanel({
  allColumns,
  selectedColumns,
  setSelectedColumns,
  filter,
  onFilterChange,
  filterConfig = { label: '', key: '', options: [] },
}) {
  const [expanded, setExpanded] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [filterValue, setFilterValue] = useState(filter?.[filterConfig.key] || '');

  const handleColumnToggle = (columnKey, isChecked) => {
    if (isChecked) {
      setSelectedColumns((prev) => [...prev, columnKey]);
    } else {
      setSelectedColumns((prev) => prev.filter((k) => k !== columnKey));
    }
  };

  const handleSelectAll = () => {
    if (selectedColumns.length === allColumns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(allColumns.map((col) => col.key));
    }
  };

  const isAllSelected = selectedColumns.length === allColumns.length;
  const isIndeterminate =
    selectedColumns.length > 0 && selectedColumns.length < allColumns.length;

  return (
    <div className={styles.rightPanel}>
      {/* Filter Section */}
      {filterConfig.label && (
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
                <label className={styles.filterLabel}>
                  <span className={styles.filterLabelText}>{filterConfig.label}</span>
                  <Select
                    id={filterConfig.key + 'Filter'}
                    value={filterValue}
                    onChange={(e) => {
                      setFilterValue(e.target.value);
                      if (onFilterChange) {
                        onFilterChange({ ...filter, [filterConfig.key]: e.target.value });
                      }
                    }}
                    options={filterConfig.options}
                    label={null}
                  />
                </label>
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
              {selectedColumns.length}/{allColumns.length}
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
