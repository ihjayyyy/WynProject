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
      case 'APPROVED':
        return '#10b981'; // green
      case 'DRAFT':
        return '#6b7280'; // gray
      case 'ORDERED':
        return '#3b82f6'; // blue
      case 'CANCELLED':
        return '#ef4444'; // red
      case 'PENDING':
        return '#f59e0b'; // amber
      default:
        return '#6b7280';
    }
  };

  const formatLabel = (status) => {
    if (!status) return '';
    // show Title Case for nicer display
    return status
      .toString()
      .split(/[_\s]+/) // split on underscores or spaces
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className={`${styles.priority} ${className}`}>
      <div
        className={styles.priorityDot}
        style={{ backgroundColor: getStatusColor(status) }}
      ></div>
      <span>{formatLabel(status)}</span>
    </div>
  );
}
