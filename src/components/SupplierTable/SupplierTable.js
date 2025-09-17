
import React from 'react';
import styles from './SupplierTable.module.scss';

export default function SupplierTable({ suppliers, columns, sortConfig, onSort, onRowClick, onActionClick, emptyMessage }) {
  if (!suppliers || suppliers.length === 0) {
    return <div className={styles.empty}>{emptyMessage || 'No suppliers found'}</div>;
  }

  // Default column widths (can be customized per column)
  const columnWidths = {
    CompanyCode: '120px',
    Name: '180px',
    Logo: '48px',
    Address: '220px',
    Phone: '130px',
    Fax: '130px',
    Email: '180px',
    Website: '160px'
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={col.align ? styles[col.align] : ''}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
                style={{ cursor: col.sortable ? 'pointer' : 'default', width: columnWidths[col.key] || 'auto', maxWidth: columnWidths[col.key] || 'auto' }}
              >
                {col.header || col.label}
                {col.sortable && sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {suppliers.map(supplier => (
            <tr key={supplier.CompanyGuid} onClick={() => onRowClick(supplier)}>
              {columns.map(col => (
                <td
                  key={col.key}
                  className={col.align ? styles[col.align] : ''}
                  style={{ width: columnWidths[col.key] || 'auto', maxWidth: columnWidths[col.key] || 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: col.key === 'Logo' ? 'normal' : 'nowrap' }}
                >
                  {col.key === 'Logo'
                    ? (col.render ? col.render(supplier) : supplier[col.key])
                    : <span className={styles.ellipsis}>{col.render ? col.render(supplier) : supplier[col.key]}</span>
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
