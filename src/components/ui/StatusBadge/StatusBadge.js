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
      // Project statuses
      case 'NOTSTARTED':
      case 'NOT STARTED':
      case 'NOT_STARTED':
        return styles.notStarted;
      case 'ONGOING':
        return styles.ongoing;
      case 'COMPLETED':
        return styles.completed;
      case 'CLOSED':
        return styles.closed;
      // Delivery / purchase statuses
      case 'PREPARED':
        return styles.prepared;
      case 'PARTIAL':
        return styles.partial;
      case 'DELIVERED':
        return styles.delivered;
      
      case 'APPROVED':
        return styles.approved;
      case 'FORAPPROVAL':
      case 'FOR APPROVAL':
      case 'FOR_APPROVAL':
        return styles.forApproval;
      case 'DRAFT':
        return styles.draft;
      case 'BILLED':
        return styles.billed;
      case 'ORDERED':
        return styles.ordered;
      case 'CANCELLED':
        return styles.cancelled;
      case 'REJECTED':
        return styles.rejected;
      case 'SUBMITTED':
        return styles.submitted;
      case 'ACKNOWLEDGED':
        return styles.acknowledged;
      case 'CREATED':
        return styles.created;
      case 'PENDING':
        return styles.pending;
      case 'WON':
      case 'WIN':
        return styles.won;
      case 'LOST':
      case 'LOSE':
        return styles.lost;
      case 'PAID':
        return styles.paid;
      case 'UNPAID':
        return styles.unpaid;
      case 'PARTIALLYPAID':
      case 'PARTIALLY PAID':
      case 'PARTIALLY_PAID':
        return styles.partiallyPaid;
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
