"use client";

import React from 'react';
import styles from './StatusBadge.module.scss';

export default function StatusBadge({ status, className = '' }) {
  const s = status ? status.toString() : '';

  const formatLabel = (status) => {
    if (!status) return '';
    return status
      .toString()
      .split(/[_\s]+/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(' ');
  };

  const pickVariant = (status) => {
    if (!status) return styles.default;
    switch (status.toString().toUpperCase()) {
      // Delivery / purchase statuses
      case 'PREPARED':
        return styles.prepared;
      case 'PARTIAL':
        return styles.partial;
      case 'DELIVERED':
        return styles.delivered;
      
      case 'APPROVED':
        return styles.approved;
      case 'DRAFT':
        return styles.draft;
      case 'ORDERED':
        return styles.ordered;
      case 'CANCELLED':
        return styles.cancelled;
      case 'PENDING':
        return styles.pending;
      default:
        return styles.default;
    }
  };

  const variantClass = pickVariant(s);

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`.trim()}>
      {formatLabel(s)}
    </span>
  );
}
