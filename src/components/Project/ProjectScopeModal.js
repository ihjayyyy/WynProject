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

  const daysBetween = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return 0;
    return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
  };

  const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    d.setDate(d.getDate() + Number(days));
    return d.toISOString().split('T')[0];
  };

  const buildForm = (init = {}) => {
    init = init || {};
    const today = new Date();
    const defaultStart = formatISODate(today);
    const defaultEnd = formatISODate(addMonths(today, 1));

    return {
      id: 0,
      name: '',
      code: '',
      percentage: 0,
      laborPercentage: 0,
      description: '',
      forecastedStartDate: defaultStart,
      forecastedEndDate: defaultEnd,
      actualStartDate: defaultStart,
      actualEndDate: defaultStart,
      milestoneDate: defaultStart,
      forecastedDuration: 0,
      actualDuration: 0,
      ...init,
      // compute durations from dates if not provided
      forecastedDuration: init.forecastedDuration ?? daysBetween(init.forecastedStartDate || defaultStart, init.forecastedEndDate || defaultEnd),
      actualDuration: init.actualDuration ?? daysBetween(init.actualStartDate || defaultStart, init.actualEndDate || defaultStart),
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
      name: 'code',
      label: 'Code',
      type: 'text',
      value: form.code || '',
      validator: Yup.string().notRequired(),
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      value: form.name || '',
      validator: Yup.string().required('Name is required'),
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      value: form.description || '',
      validator: Yup.string().notRequired(),
    },
    {
      name: 'laborPercentage',
      label: 'Labor Percentage (%)',
      type: 'number',
      value: Number(form.laborPercentage) || 0,
      validator: Yup.number().min(0).max(100).notRequired(),
    },
    {
      name: 'percentage',
      label: 'Percentage',
      type: 'number',
      value: Number(form.percentage) || 0,
      validator: Yup.number().min(0).notRequired(),
      hidden: true,
    },
    {
      name: 'milestoneDate',
      label: 'Milestone Date',
      type: 'date',
      value: form.milestoneDate ? String(form.milestoneDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
      hidden: true,
    },
    {
      name: 'forecastedStartDate',
      label: 'Forecasted Start',
      type: 'date',
      value: form.forecastedStartDate ? String(form.forecastedStartDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const end = itemFields.find((f) => f.name === 'forecastedEndDate')?.value || '';
        updateField('forecastedDuration', daysBetween(nextValue, end));
      },
    },
    {
      name: 'forecastedEndDate',
      label: 'Forecasted End',
      type: 'date',
      value: form.forecastedEndDate ? String(form.forecastedEndDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const start = itemFields.find((f) => f.name === 'forecastedStartDate')?.value || '';
        updateField('forecastedDuration', daysBetween(start, nextValue));
      },
    },
    {
      name: 'forecastedDuration',
      label: 'Forecasted Duration (days)',
      type: 'number',
      value: Number(form.forecastedDuration) || 0,
      validator: Yup.number()
      .typeError('Forecasted Duration must be a number')
      .integer('Forecasted Duration must be a whole number')
      .min(0, 'Forecasted Duration cannot be negative')
      .required('Forecasted Duration is required'),
      onChange: (item, updateField, itemFields, nextValue) => {
        const start = itemFields.find((f) => f.name === 'forecastedStartDate')?.value || '';
        const newEnd = addDays(start, Number(nextValue) || 0);
        if (newEnd) updateField('forecastedEndDate', newEnd);
      },
    },
    {
      name: 'actualStartDate',
      label: 'Actual Start',
      type: 'date',
      value: form.actualStartDate ? String(form.actualStartDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const end = itemFields.find((f) => f.name === 'actualEndDate')?.value || '';
        updateField('actualDuration', daysBetween(nextValue, end));
      },
    },
    {
      name: 'actualEndDate',
      label: 'Actual End',
      type: 'date',
      value: form.actualEndDate ? String(form.actualEndDate).split('T')[0] : '',
      validator: Yup.string().notRequired(),
      onChange: (item, updateField, itemFields, nextValue) => {
        const start = itemFields.find((f) => f.name === 'actualStartDate')?.value || '';
        updateField('actualDuration', daysBetween(start, nextValue));
      },
    },
    {
      name: 'actualDuration',
      label: 'Actual Duration (days)',
      type: 'number',
      value: Number(form.actualDuration) || 0,
      validator: Yup.number()
      .typeError('Actual Duration must be a number')
      .integer('Actual Duration must be a whole number')
      .min(0, 'Actual Duration cannot be negative')
      .required('Actual Duration is required'),
      onChange: (item, updateField, itemFields, nextValue) => {
        const start = itemFields.find((f) => f.name === 'actualStartDate')?.value || '';
        const newEnd = addDays(start, Number(nextValue) || 0);
        if (newEnd) updateField('actualEndDate', newEnd);
      },
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
          laborPercentage: Number(val.laborPercentage) || 0,
          percentage: Number(val.percentage) || 0,
          description: val.description || '',
          forecastedStartDate: val.forecastedStartDate || null,
          forecastedEndDate: val.forecastedEndDate || null,
          actualStartDate: val.actualStartDate || null,
          actualEndDate: val.actualEndDate || null,
          milestoneDate: val.milestoneDate || null,
          forecastedDuration: Number(val.forecastedDuration) || 0,
          actualDuration: Number(val.actualDuration) || 0,
        };
        onConfirm && onConfirm(payload);
      }}
    />
  );
}
