'use client';

import React from 'react';
import { FiMoreVertical, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
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

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data, pageSize]);

  const totalItems = Array.isArray(data) ? data.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedData = pagination ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize) : data;

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
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  style={{
                    textAlign: column.align || 'left',
                    width: column.width || 'auto'
                  }}
                >
                  {column.header}
                </th>
              ))}
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