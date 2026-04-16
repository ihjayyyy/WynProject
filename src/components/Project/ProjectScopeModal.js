"use client";
import React, { useMemo } from 'react';
import * as Yup from 'yup';
import ItemModal from '../ItemDetails/itemModal';

export default function ProjectScopeModal({ open, initial = {}, onCancel, onConfirm }) {
  const formatISODate = (date) => {
    if (!date) return null;
    try {
      // Accept Date or string-like inputs, normalize to YYYY-MM-DD
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  };

  const addMonths = (date, months) => {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // handle month overflow
    if (d.getDate() !== day) {
      d.setDate(0);
    }
    return d;
  };

  const buildForm = (init = {}) => {
    const today = new Date();
    const defaultStart = formatISODate(today);
    const defaultEnd = formatISODate(addMonths(today, 1));

    return {
      id: 0,
      name: '',
      code: '',
      percentage: 0,
      description: '',
      forecastedStartDate: defaultStart,
      forecastedEndDate: defaultEnd,
      actualStartDate: null,
      actualEndDate: null,
      milestoneDate: defaultEnd,
      ...init,
    };
  };

  const form = buildForm(initial);

  const fields = useMemo(() => [
    {
      name: 'id',
      label: 'Id',
      type: 'number',
      value: Number(form.id) || 0,
      hidden: true,
      validator: Yup.number().notRequired(),
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      value: form.name || '',
      validator: Yup.string().required('Name is required'),
    },
    {
      name: 'code',
      label: 'Code',
      type: 'text',
      value: form.code || '',
      validator: Yup.string().notRequired(),
    },
    {
      name: 'percentage',
      label: 'Percentage',
      type: 'number',
      value: Number(form.percentage) || 0,
      validator: Yup.number().min(0).notRequired(),
    },
    {
      name: 'milestoneDate',
      label: 'Milestone Date',
      type: 'date',
      value: form.milestoneDate ? String(form.milestoneDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
    },
    {
      name: 'forecastedStartDate',
      label: 'Forecasted Start',
      type: 'date',
      value: form.forecastedStartDate ? String(form.forecastedStartDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
    },
    {
      name: 'forecastedEndDate',
      label: 'Forecasted End',
      type: 'date',
      value: form.forecastedEndDate ? String(form.forecastedEndDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
    },
    {
      name: 'actualStartDate',
      label: 'Actual Start',
      type: 'date',
      value: form.actualStartDate ? String(form.actualStartDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
    },
    {
      name: 'actualEndDate',
      label: 'Actual End',
      type: 'date',
      value: form.actualEndDate ? String(form.actualEndDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      value: form.description || '',
      validator: Yup.string().notRequired(),
    },
  ], [form]);

  return (
    <ItemModal
      headerLabel={form && form.id ? 'Edit Scope' : 'Add Scope'}
      mode="new"
      itemIndex={-1}
      isOpen={open}
      fields={fields}
      onItemRemove={() => {}}
      onClose={(val) => {
        if (!val) {
          onCancel && onCancel();
          return;
        }
        const payload = {
          id: Number(val.id) || 0,
          name: val.name || '',
          code: val.code || '',
          percentage: Number(val.percentage) || 0,
          description: val.description || '',
          forecastedStartDate: val.forecastedStartDate || null,
          forecastedEndDate: val.forecastedEndDate || null,
          actualStartDate: val.actualStartDate || null,
          actualEndDate: val.actualEndDate || null,
          milestoneDate: val.milestoneDate || null,
        };
        onConfirm && onConfirm(payload);
      }}
    />
  );
}
