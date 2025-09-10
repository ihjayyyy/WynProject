'use client';

import React from 'react';
import styles from './StatusDot.module.scss';

export default function StatusDot({ 
  status, 
  color,
  className = '' 
}) {
  const getStatusColor = (status) => {
    if (color) return color;
    
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'INACTIVE': return '#ef4444';
      case 'COMPLETED': return '#10b981';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`${styles.priority} ${className}`}>
      <div 
        className={styles.priorityDot}
        style={{ backgroundColor: getStatusColor(status) }}
      ></div>
      <span>{status}</span>
    </div>
  );
}
