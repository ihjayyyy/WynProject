'use client';

import React from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import styles from './DataTable.module.scss';

export default function DataTable({
  columns = [],
  data = [],
  onRowClick,
  onActionClick,
  className = '',
  showActions = true,
  emptyMessage = 'No data available'
}) {
  const handleRowClick = (item) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const handleActionClick = (e, item) => {
    e.stopPropagation(); // Prevent row click when action is clicked
    if (onActionClick) {
      onActionClick(item);
    }
  };

  const renderCellContent = (item, column) => {
    if (column.render) {
      return column.render(item);
    }
    
    if (column.key) {
      return item[column.key];
    }
    
    return '';
  };

  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${styles.tableContainer} ${className}`}>
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
            {showActions && <th></th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={item.id || index}
              className={`${styles.tableRow} ${onRowClick ? styles.clickable : ''}`}
              onClick={() => handleRowClick(item)}
            >
              {columns.map((column, colIndex) => (
                <td 
                  key={column.key || colIndex}
                  style={{ 
                    textAlign: column.align || 'left'
                  }}
                >
                  {renderCellContent(item, column)}
                </td>
              ))}
              {showActions && (
                <td>
                  <button 
                    className={styles.menuButton}
                    onClick={(e) => handleActionClick(e, item)}
                  >
                    <FiMoreVertical size={16} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
