"use client";

import React from 'react';
import styles from './StatusBadge.module.scss';

export default function StatusBadge({ status, className = '' }) {
  const s = status ? status.toString() : '';

  const getColors = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'DRAFT':
        return { bg: '#f3f4f6', color: '#374151' };
      case 'ORDERED':
        return { bg: '#dbeafe', color: '#1e3a8a' };
      case 'CANCELLED':
        return { bg: '#fee2e2', color: '#991b1b' };
      case 'PENDING':
        return { bg: '#fffbeb', color: '#92400e' };
      default:
        return { bg: '#f3f4f6', color: '#374151' };
    }
  };

  const formatLabel = (status) => {
    if (!status) return '';
    return status
      .toString()
      .split(/[_\s]+/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(' ');
  };

  const colors = getColors(s);

  return (
    <span
      className={`${styles.badge} ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.color }}
    >
      {formatLabel(s)}
    </span>
  );
}
