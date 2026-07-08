"use client";
import React, { useMemo } from 'react';
import * as Yup from 'yup';
import ItemModal from '../ItemDetails/itemModal';

export default function ProposalScopeModal({
  open,
  initial = null,
  defaultLaborPercentage = 0,
  onCancel,
  onConfirm,
  // Finance permission (lowercase 'f'). When false, Labor Percentage
  // renders read-only while Scope of Work and Duration stay editable.
  canEditFinance = true,
}) {
  const scopeOfWork  = initial && typeof initial === 'object' ? (initial.scopeOfWork  || '') : (initial || '');
  const laborPct     = initial && typeof initial === 'object' ? (Number(initial.laborPercentage) || 0) : (Number(defaultLaborPercentage) || 0);
  const scopeDur     = initial && typeof initial === 'object' ? (Number(initial.scopeDuration)   || 0) : 0;

  const fields = useMemo(() => [
    {
      name: 'scopeOfWork',
      label: 'Scope of Work',
      type: 'text',
      value: scopeOfWork,
      validator: Yup.string().required('Scope of work is required'),
    },
    {
      name: 'laborPercentage',
      label: 'Labor Percentage (%)',
      type: 'number',
      value: laborPct,
      readonly: !canEditFinance,
      validator: Yup.number().min(0).max(100).notRequired(),
    },
    {
      name: 'scopeDuration',
      label: 'Scope Duration (days)',
      type: 'number',
      value: scopeDur,
      validator: Yup.number().min(0).notRequired(),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [scopeOfWork, laborPct, scopeDur, canEditFinance]);

  return (
    <ItemModal
      headerLabel={initial ? 'Edit Scope of Work' : 'Add Scope of Work'}
      mode="new"
      itemIndex={-1}
      isOpen={open}
      fields={fields}
      onItemRemove={() => {}}
      confirmOnClose
      onClose={(val) => {
        if (!val) { onCancel && onCancel(); return; }
        // Guard against a changed labor % sneaking through even if the
        // input were somehow editable — always fall back to the original
        // value when the user lacks finance access.
        const submittedPct = Number(val.laborPercentage) || 0;
        const finalPct = canEditFinance ? submittedPct : laborPct;
        onConfirm && onConfirm({
          scopeOfWork: val.scopeOfWork || '',
          laborPercentage: finalPct,
          scopeDuration: Number(val.scopeDuration) || 0,
        });
      }}
    />
  );
}