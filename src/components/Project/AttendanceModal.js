"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '../ui/ConfirmModal/ConfirmModal.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import Select from '../ui/Select/Select';

function toDateValue(value) {
  if (!value) return '';
  const stringValue = String(value);
  return stringValue.includes('T') ? stringValue.split('T')[0] : stringValue.slice(0, 10);
}

function getTodayValue() {
  return new Date().toISOString().split('T')[0];
}

function toTimeValue(value) {
  if (!value) return '';
  const stringValue = String(value);
  if (stringValue.includes('T')) {
    const parsed = new Date(stringValue);
    if (!Number.isNaN(parsed.getTime())) return parsed.toTimeString().slice(0, 5);
  }
  return stringValue.slice(0, 5);
}

function parseTime(value) {
  if (!value) return null;
  const [hours, minutes] = String(value).split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function calculateWorkedHours(clockIn, clockOut) {
  const clockInMinutes = parseTime(clockIn);
  const clockOutMinutes = parseTime(clockOut);

  if (clockInMinutes === null || clockOutMinutes === null) return 0;

  let diffMinutes = clockOutMinutes - clockInMinutes;
  if (diffMinutes < 0) diffMinutes += 24 * 60;

  return Math.max(0, Number((diffMinutes / 60).toFixed(2)));
}

function calculateOvertimeHours(hours) {
  const totalHours = Number(hours) || 0;
  return Math.max(0, Number((totalHours - 9).toFixed(2)));
}

function calculateTotalCost(ratePerHour, hours, overtimeApproved, deductLunchBreak) {
  const totalHours = Number(hours) || 0;
  const overtimeHours = calculateOvertimeHours(totalHours);
  const regularHours = Math.max(0, Number((totalHours - overtimeHours).toFixed(2)));
  const lunchDeduction = deductLunchBreak ? Math.min(1, regularHours) : 0;
  const payableRegularHours = Math.max(0, Number((regularHours - lunchDeduction).toFixed(2)));
  const payableHours = payableRegularHours + (overtimeApproved ? overtimeHours : 0);
  return Number((payableHours * (Number(ratePerHour) || 0)).toFixed(2));
}

function buildFormState(init = {}, projectId = 0) {
  const initialDate = toDateValue(init.date);

  return {
    id: 0,
    name: '',
    code: '',
    staffId: 0,
    projectId: Number(projectId) || 0,
    date: '',
    clockIn: '',
    clockOut: '',
    hours: 0,
    totalCost: 0,
    overtimeApproved: false,
    overtimeHours: 0,
    deductLunchBreak: false,
    ...init,
    projectId: Number(init.projectId) || Number(projectId) || 0,
    date: initialDate || getTodayValue(),
    clockIn: toTimeValue(init.clockIn),
    clockOut: toTimeValue(init.clockOut),
    overtimeApproved: Boolean(init.overtimeApproved),
    deductLunchBreak: Boolean(init.deductLunchBreak),
  };
}

export default function AttendanceModal({ open, initial = {}, staffOptions = [], projectId = 0, onCancel, onConfirm }) {
  const [form, setForm] = useState(() => buildFormState(initial, projectId));

  useEffect(() => {
    setForm(buildFormState(initial, projectId));
  }, [initial, open, projectId]);

  useEffect(() => {
    if (!open || !form.staffId) return;
    const selectedStaff = staffOptions.find((staff) => Number(staff.value) === Number(form.staffId));
    if (!selectedStaff) return;

    setForm((currentForm) => {
      const nextOvertimeHours = calculateOvertimeHours(currentForm.hours);
      const nextTotalCost = calculateTotalCost(
        selectedStaff.ratePerHour,
        currentForm.hours,
        currentForm.overtimeApproved,
        currentForm.deductLunchBreak
      );

      if (
        currentForm.name === (selectedStaff.name || selectedStaff.label || '') &&
        currentForm.code === (selectedStaff.code || '') &&
        Number(currentForm.overtimeHours) === nextOvertimeHours &&
        Number(currentForm.totalCost) === nextTotalCost
      ) {
        return currentForm;
      }

      return {
        ...currentForm,
        name: selectedStaff.name || selectedStaff.label || '',
        code: selectedStaff.code || '',
        overtimeHours: nextOvertimeHours,
        totalCost: nextTotalCost,
      };
    });
  }, [form.staffId, form.hours, form.overtimeApproved, form.deductLunchBreak, open, staffOptions]);

  useEffect(() => {
    if (!open || !form.clockIn || !form.clockOut) return;

    setForm((currentForm) => {
      const calculatedHours = calculateWorkedHours(currentForm.clockIn, currentForm.clockOut);
      const calculatedOvertimeHours = calculateOvertimeHours(calculatedHours);
      const selectedStaff = staffOptions.find((staff) => Number(staff.value) === Number(currentForm.staffId));
      const nextTotalCost = calculateTotalCost(
        selectedStaff?.ratePerHour,
        calculatedHours,
        currentForm.overtimeApproved,
        currentForm.deductLunchBreak
      );

      if (
        Number(currentForm.hours) === calculatedHours &&
        Number(currentForm.overtimeHours) === calculatedOvertimeHours &&
        Number(currentForm.totalCost) === nextTotalCost
      ) {
        return currentForm;
      }

      return {
        ...currentForm,
        hours: calculatedHours,
        overtimeHours: calculatedOvertimeHours,
        totalCost: nextTotalCost,
      };
    });
  }, [form.clockIn, form.clockOut, form.deductLunchBreak, form.staffId, form.overtimeApproved, open, staffOptions]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => { if (event.key === 'Escape') onCancel && onCancel(); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const updateField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [key]: value };

      if (key === 'hours') {
        nextForm.overtimeHours = calculateOvertimeHours(value);
      }

      if (key === 'hours' || key === 'overtimeApproved' || key === 'deductLunchBreak') {
        const selectedStaff = staffOptions.find((staff) => Number(staff.value) === Number(nextForm.staffId));
        nextForm.totalCost = calculateTotalCost(
          selectedStaff?.ratePerHour,
          nextForm.hours,
          nextForm.overtimeApproved,
          nextForm.deductLunchBreak
        );
      }

      return nextForm;
    });
  };

  const handleStaffSelect = (event) => {
    const staffId = Number(event.target.value) || 0;
    const selectedStaff = staffOptions.find((staff) => Number(staff.value) === Number(staffId));
    setForm((currentForm) => ({
      ...currentForm,
      staffId,
      name: selectedStaff?.name || selectedStaff?.label || currentForm.name,
      code: selectedStaff?.code || currentForm.code,
      overtimeHours: calculateOvertimeHours(currentForm.hours),
      totalCost: calculateTotalCost(
        selectedStaff?.ratePerHour,
        currentForm.hours,
        currentForm.overtimeApproved,
        currentForm.deductLunchBreak
      ),
    }));
  };

  const content = (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()} style={{ width: 'min(720px, 100%)' }}>
        <h3 className={styles.title}>{form.id ? 'Edit Attendance' : 'Add Attendance'}</h3>
        <div className={styles.message}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Staff Member</label>
              <Select
                value={String(form.staffId || '')}
                onChange={handleStaffSelect}
                options={staffOptions}
                placeholder="Select staff"
                searchable
              />
            </div>
            <Input label="Name" value={form.name || ''} onChange={updateField('name')} />
            <Input label="Code" value={form.code || ''} onChange={updateField('code')} />
            <Input label="Date" type="date" value={form.date || ''} onChange={updateField('date')} />
            <Input label="Hours" type="number" step="0.01" value={form.hours ?? ''} readOnly />
            <Input label="Clock In" type="time" value={form.clockIn || ''} onChange={updateField('clockIn')} />
            <Input label="Clock Out" type="time" value={form.clockOut || ''} onChange={updateField('clockOut')} />
            <Input label="Overtime Hours" type="number" step="0.01" value={form.overtimeHours ?? ''} readOnly />
            <Input label="Total Cost" type="number" step="0.01" value={form.totalCost ?? ''} readOnly />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 42, marginTop: 22 }}>
              <input type="checkbox" checked={Boolean(form.overtimeApproved)} onChange={updateField('overtimeApproved')} />
              <span>Overtime Approved</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 42, marginTop: 22 }}>
              <input type="checkbox" checked={Boolean(form.deductLunchBreak)} onChange={updateField('deductLunchBreak')} />
              <span>Deduct Lunch Break</span>
            </label>
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!onConfirm) return;
              onConfirm({
                id: Number(form.id) || 0,
                name: form.name || '',
                code: form.code || '',
                staffId: Number(form.staffId) || 0,
                projectId: Number(form.projectId) || Number(projectId) || 0,
                date: form.date || '',
                clockIn: form.clockIn || '',
                clockOut: form.clockOut || '',
                hours: Number(form.hours) || 0,
                totalCost: Number(form.totalCost) || 0,
                overtimeApproved: Boolean(form.overtimeApproved),
                overtimeHours: Number(form.overtimeHours) || 0,
                deductLunchBreak: Boolean(form.deductLunchBreak),
              });
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') return createPortal(content, document.body);
  return null;
}