'use client';

import React from 'react';
import { FiMoreVertical, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import styles from './DataTable.module.scss';

const formatNumber = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Number.isInteger(val)
      ? val.toLocaleString()
      : val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return val;
};

export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  onActionClick,
  className = '',
  showActions = true,
  emptyMessage = 'No data available',
  emptyIcon = null,
  footer,
  pagination = true,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50]
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [sortKey, setSortKey] = React.useState(null);
  const [sortDir, setSortDir] = React.useState(null); // 'asc' | 'desc' | null

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data, pageSize, sortKey, sortDir]);

  const getSortValue = (item, column) => {
    // Prefer an explicit sortValue if provided, since render() may return JSX
    if (column.sortValue) return column.sortValue(item);
    return column.key ? item[column.key] : '';
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDir) return data;
    const column = columns.find((c) => (c.key || c.header) === sortKey);
    if (!column) return data;

    const arr = Array.isArray(data) ? [...data] : [];
    arr.sort((a, b) => {
      const va = getSortValue(a, column);
      const vb = getSortValue(b, column);

      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      let cmp;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else if (va instanceof Date && vb instanceof Date) {
        cmp = va.getTime() - vb.getTime();
      } else if (
        typeof va === 'string' &&
        typeof vb === 'string' &&
        /\d{4}-\d{2}-\d{2}/.test(va) &&
        /\d{4}-\d{2}-\d{2}/.test(vb) &&
        !isNaN(new Date(va)) &&
        !isNaN(new Date(vb))
      ) {
        cmp = new Date(va).getTime() - new Date(vb).getTime();
      } else {
        cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [data, columns, sortKey, sortDir]);

  const totalItems = Array.isArray(sortedData) ? sortedData.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedData = pagination ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize) : sortedData;

  const goToPage = (p) => setCurrentPage(Math.max(1, Math.min(totalPages, p)));

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value) || defaultPageSize);
    setCurrentPage(1);
  };

  const handleRowClick = (item) => {
    if (onRowClick) onRowClick(item);
  };

  const handleActionClick = (e, item, index) => {
    e.stopPropagation();
    if (onActionClick) onActionClick(item, index);
  };

  const handleSort = (column) => {
    const sortable = column.sortable !== false && (!!column.key || !!column.sortValue);
    if (!sortable) return;
    const key = column.key || column.header;

    if (sortKey !== key) {
      // New column clicked: start at ascending
      setSortKey(key);
      setSortDir('asc');
      return;
    }

    // Same column: cycle asc -> desc -> none
    if (sortDir === 'asc') {
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortKey(null);
      setSortDir(null);
    } else {
      setSortDir('asc');
    }
  };

  const renderCellContent = (item, column) => {
    if (column.render) return column.render(item);
    if (column.key) return formatNumber(item[column.key]);
    return '';
  };

  // Build page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column, index) => {
                const key = column.key || column.header;
                const isSorted = sortKey === key && !!sortDir;
                const sortable = column.sortable !== false && (!!column.key || !!column.sortValue);
                return (
                  <th
                    key={key || index}
                    style={{
                      textAlign: column.align || 'left',
                      width: column.width || 'auto',
                      cursor: sortable ? 'pointer' : 'default',
                      userSelect: 'none'
                    }}
                    onClick={() => handleSort(column)}
                    aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <span className={styles.thContent}>
                      {column.header}
                      {sortable && (
                        <span className={styles.sortIcon}>
                          {isSorted ? (
                            sortDir === 'asc' ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />
                          ) : (
                            <span className={styles.sortIconIdle} style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0 }}>
                              <FiChevronUp size={10} style={{ marginBottom: -2 }} />
                              <FiChevronDown size={10} />
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
              {showActions && <th aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {(!pagedData || pagedData.length === 0) && (
              <tr className={styles.emptyRow}>
                <td colSpan={columns.length + (showActions ? 1 : 0)}>
                  <div className={styles.emptyState}>
                    {emptyIcon && <span className={styles.emptyIcon}>{emptyIcon}</span>}
                    <p className={styles.emptyMessage}>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
            {pagedData.map((item, index) => {
              if (item && item.fullRow) {
                const span = columns.length + (showActions ? 1 : 0);
                return (
                  <tr key={`fullrow-${index}`} className={styles.tableRow} onClick={() => handleRowClick(item)}>
                    <td colSpan={span}>{item.fullRowContent}</td>
                  </tr>
                );
              }

              return (
                <tr
                  key={`row-${index}`}
                  className={`${styles.tableRow} ${item.isTotalRow ? styles.totalRow : ''} ${onRowClick ? styles.clickable : ''}`}
                  onClick={() => handleRowClick(item)}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={column.key || colIndex}
                      className={item.isTotalRow ? styles.totalCell : ''}
                      style={{ textAlign: column.align || 'left' }}
                    >
                      {renderCellContent(item, column)}
                    </td>
                  ))}
                  {showActions && (
                    <td>
                      <button
                        type="button"
                        className={styles.menuButton}
                        onClick={(e) => handleActionClick(e, item, index)}
                        aria-label="Row actions"
                      >
                        <FiMoreVertical size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {footer && <tfoot>{footer}</tfoot>}
        </table>
      </div>

      {pagination && (
        <div className={styles.pagination}>
          <div className={styles.pageButtons}>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              aria-label="First page"
            >
              <FiChevronsLeft size={13} />
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <FiChevronLeft size={13} />
            </button>

            {getPageNumbers().map((page, i) =>
              page === '...' ? (
                <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
              ) : (
                <button
                  key={page}
                  type="button"
                  className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                  onClick={() => goToPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <FiChevronRight size={13} />
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Last page"
            >
              <FiChevronsRight size={13} />
            </button>
          </div>

          <div className={styles.pageSize}>
            <span>Show</span>
            <select value={pageSize} onChange={handlePageSizeChange} aria-label="Rows per page">
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <span>
              per page
              {totalItems > 0 && (
                <> · <strong>{totalItems.toLocaleString()}</strong> total</>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}