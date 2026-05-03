'use client';

import React, { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import ItemModal from '../ItemDetails/itemModal';
import styles from './ProjectScope.module.scss';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getAttendanceByProjectId, createAttendance, updateAttendance, deleteAttendance } from '../../services/Attendance';
import { getStaffs } from '../../services/Staff';
import { useToast } from '../ui/Toast/Toast';
import { useConfirmModal } from '@/app/contextProviders/confirmModalContext';
import { AccessContext } from '@/app/contextProviders/accessContext';
import * as Yup from 'yup';

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentWorkingWeek() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString();
  return String(value);
}

function formatTime(value) {
  if (!value) return '—';
  const stringValue = String(value);
  if (stringValue.includes('T')) {
    const parsed = new Date(stringValue);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  }

  const timeMatch = stringValue.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = timeMatch[2];
    if (!Number.isNaN(hours) && hours >= 0 && hours <= 23) {
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${minutes} ${suffix}`;
    }
  }

  return stringValue;
}

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

function getFieldValue(itemFields, fieldName, fallback = '') {
  const field = itemFields.find((entry) => entry.name === fieldName);
  return field ? field.value : fallback;
}

function findStaff(staffOptions, staffId) {
  return staffOptions.find((staff) => Number(staff.value) === Number(staffId));
}

const BASE_COLUMNS = [
  { header: 'Date', key: 'date', render: (item) => formatDate(item.date) },
  { header: 'Name', key: 'name' },
  { header: 'Code', key: 'code' },
  { header: 'Clock In', key: 'clockIn', render: (item) => formatTime(item.clockIn) },
  { header: 'Clock Out', key: 'clockOut', render: (item) => formatTime(item.clockOut) },
  { header: 'Hours', key: 'hours', render: (item) => Number(item.hours || 0).toFixed(2) },
  { header: 'OT Hours', key: 'overtimeHours', render: (item) => Number(item.overtimeHours || 0).toFixed(2) },
];

export default function AttendanceTab({ projectId = 0 }) {
  const PageName = 'Projects.Projects';
  const { isAllowed } = useContext(AccessContext);
  const [defaultDateRange] = useState(getCurrentWorkingWeek);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [startDate, setStartDate] = useState(defaultDateRange.startDate);
  const [endDate, setEndDate] = useState(defaultDateRange.endDate);
  const toast = useToast();
  const confirmModal = useConfirmModal();

  const attendanceModalFields = useMemo(() => {
    const record = editing || {};
    const initialStaffId = Number(record.staffId) || 0;
    const selectedStaff = findStaff(staffOptions, initialStaffId);
    const initialClockIn = toTimeValue(record.clockIn);
    const initialClockOut = toTimeValue(record.clockOut);
    const initialHours = initialClockIn && initialClockOut
      ? calculateWorkedHours(initialClockIn, initialClockOut)
      : Number(record.hours) || 0;
    const initialOvertimeApproved = Boolean(record.overtimeApproved);
    const initialDeductLunchBreak = Boolean(record.deductLunchBreak);
    const initialOvertimeHours = calculateOvertimeHours(initialHours);
    const initialTotalCost = calculateTotalCost(
      selectedStaff?.ratePerHour,
      initialHours,
      initialOvertimeApproved,
      initialDeductLunchBreak
    );

    const selectableStaff = staffOptions.map((staff) => ({
      value: String(staff.value),
      name: staff.label,
    }));

    return [
      {
        name: 'id',
        label: 'Id',
        type: 'number',
        value: Number(record.id) || 0,
        hidden: true,
        validator: Yup.number().notRequired(),
      },
      {
        name: 'projectId',
        label: 'Project Id',
        type: 'number',
        value: Number(projectId) || 0,
        hidden: true,
        validator: Yup.number().notRequired(),
      },
      {
        name: 'name',
        label: 'Name',
        type: 'text',
        value: record.name || selectedStaff?.name || '',
        hidden: true,
        validator: Yup.string().notRequired(),
      },
      {
        name: 'code',
        label: 'Code',
        type: 'text',
        value: record.code || selectedStaff?.code || '',
        hidden: true,
        validator: Yup.string().notRequired(),
      },
      {
        name: 'staffId',
        label: 'Staff Member',
        type: 'select',
        value: initialStaffId ? String(initialStaffId) : '',
        options: selectableStaff,
        validator: Yup.string().required('Staff member is required'),
        onChange: (item, updateField, itemFields, nextValue) => {
          const selected = findStaff(staffOptions, nextValue);
          const hours = Number(getFieldValue(itemFields, 'hours', 0)) || 0;
          const overtimeApproved = Boolean(getFieldValue(itemFields, 'overtimeApproved', false));
          const deductLunchBreak = Boolean(getFieldValue(itemFields, 'deductLunchBreak', false));
          updateField('name', selected?.name || selected?.label || '');
          updateField('code', selected?.code || '');
          updateField('overtimeHours', calculateOvertimeHours(hours));
          updateField('totalCost', calculateTotalCost(selected?.ratePerHour, hours, overtimeApproved, deductLunchBreak));
        },
      },
      {
        name: 'date',
        label: 'Date',
        type: 'date',
        value: toDateValue(record.date) || getTodayValue(),
        readonly: true,
        validator: Yup.string().required('Date is required'),
      },
      {
        name: 'clockIn',
        label: 'Clock In',
        type: 'time',
        value: initialClockIn,
        validator: Yup.string().required('Clock in is required'),
        onChange: (item, updateField, itemFields, nextValue) => {
          const clockOut = getFieldValue(itemFields, 'clockOut', '');
          const hours = calculateWorkedHours(nextValue, clockOut);
          const overtimeApproved = Boolean(getFieldValue(itemFields, 'overtimeApproved', false));
          const deductLunchBreak = Boolean(getFieldValue(itemFields, 'deductLunchBreak', false));
          const staffId = getFieldValue(itemFields, 'staffId', 0);
          const selected = findStaff(staffOptions, staffId);
          updateField('hours', hours);
          updateField('overtimeHours', calculateOvertimeHours(hours));
          updateField('totalCost', calculateTotalCost(selected?.ratePerHour, hours, overtimeApproved, deductLunchBreak));
        },
      },
      {
        name: 'clockOut',
        label: 'Clock Out',
        type: 'time',
        value: initialClockOut,
        validator: Yup.string().required('Clock out is required'),
        onChange: (item, updateField, itemFields, nextValue) => {
          const clockIn = getFieldValue(itemFields, 'clockIn', '');
          const hours = calculateWorkedHours(clockIn, nextValue);
          const overtimeApproved = Boolean(getFieldValue(itemFields, 'overtimeApproved', false));
          const deductLunchBreak = Boolean(getFieldValue(itemFields, 'deductLunchBreak', false));
          const staffId = getFieldValue(itemFields, 'staffId', 0);
          const selected = findStaff(staffOptions, staffId);
          updateField('hours', hours);
          updateField('overtimeHours', calculateOvertimeHours(hours));
          updateField('totalCost', calculateTotalCost(selected?.ratePerHour, hours, overtimeApproved, deductLunchBreak));
        },
      },
      {
        name: 'hours',
        label: 'Hours',
        type: 'number',
        value: initialHours,
        readonly: true,
        validator: Yup.number().min(0).notRequired(),
      },
      {
        name: 'overtimeHours',
        label: 'Overtime Hours',
        type: 'number',
        value: initialOvertimeHours,
        readonly: true,
        validator: Yup.number().min(0).notRequired(),
      },
      {
        name: 'overtimeApproved',
        label: 'Overtime Approved',
        type: 'checkbox',
        value: initialOvertimeApproved,
        validator: Yup.boolean().notRequired(),
        onChange: (item, updateField, itemFields, nextValue) => {
          const hours = Number(getFieldValue(itemFields, 'hours', 0)) || 0;
          const deductLunchBreak = Boolean(getFieldValue(itemFields, 'deductLunchBreak', false));
          const staffId = getFieldValue(itemFields, 'staffId', 0);
          const selected = findStaff(staffOptions, staffId);
          updateField('totalCost', calculateTotalCost(selected?.ratePerHour, hours, Boolean(nextValue), deductLunchBreak));
        },
      },
      {
        name: 'deductLunchBreak',
        label: 'Deduct Lunch Break',
        type: 'checkbox',
        value: initialDeductLunchBreak,
        validator: Yup.boolean().notRequired(),
        onChange: (item, updateField, itemFields, nextValue) => {
          const hours = Number(getFieldValue(itemFields, 'hours', 0)) || 0;
          const overtimeApproved = Boolean(getFieldValue(itemFields, 'overtimeApproved', false));
          const staffId = getFieldValue(itemFields, 'staffId', 0);
          const selected = findStaff(staffOptions, staffId);
          updateField('totalCost', calculateTotalCost(selected?.ratePerHour, hours, overtimeApproved, Boolean(nextValue)));
        },
      },
      {
        name: 'totalCost',
        label: 'Total Cost',
        type: 'number',
        value: initialTotalCost,
        readonly: true,
        hidden: true,
        validator: Yup.number().min(0).notRequired(),
      },
    ];
  }, [editing, projectId, staffOptions]);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    const response = await getAttendanceByProjectId(projectId, startDate, endDate);
    if (response?.error) {
      setItems([]);
      return;
    }

    const raw = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
    setItems(raw);
  }, [endDate, projectId, startDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async (itemId) => {
    const idToDelete = Number(itemId) || Number(editing?.id) || 0;
    if (!idToDelete) {
      toast.error('Failed to delete attendance');
      return;
    }

    const response = await deleteAttendance(idToDelete);
    if (response?.error) toast.error('Failed to delete attendance');
    else {
      toast.success('Attendance deleted');
      await loadData();
    }
  }, [editing?.id, loadData, toast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const response = await getStaffs();
      if (!mounted || response?.error) return;

      const list = Array.isArray(response.data) ? response.data : (response.data?.value || []);
      setStaffOptions(
        (list || []).map((staff) => ({
          value: String(staff.id),
          label: staff.name || staff.code || String(staff.id),
          name: staff.name || '',
          code: staff.code || '',
          ratePerHour: Number(staff.ratePerHour) || 0,
        }))
      );
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const keyword = (searchTerm || '').trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      [
        item.date,
        item.name,
        item.code,
        item.clockIn,
        item.clockOut,
        item.hours,
        item.overtimeHours,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [items, searchTerm]);

  const tableColumns = useMemo(() => [
    ...BASE_COLUMNS,
    {
      header: 'OT Approved',
      key: 'overtimeApproved',
      render: (item) => (item.overtimeApproved ? 'Yes' : 'No'),
    },
    {
      header: 'Lunch Break',
      key: 'deductLunchBreak',
      render: (item) => (item.deductLunchBreak ? 'Deducted' : 'Included'),
    },
    {
      header: 'Actions',
      key: '__actions',
      align: 'right',
      render: (item) => (
        <div className={styles.actionCell}>
          <Button
            size="sm"
            variant="outlinedPrimary"
            icon={<FiEdit2 />}
            title="Edit"
            onClick={() => { setEditing(item); setIsModalOpen(true); }}
          />
          <Button
            size="sm"
            variant="danger"
            icon={<FiTrash2 />}
            title="Delete"
            onClick={() => {
              const title = 'Remove attendance?';
              const message = item?.name
                ? `Remove attendance for "${item.name}" on ${formatDate(item.date)}?`
                : 'Remove this attendance record?';
              const confirmText = 'Remove';
              const variant = 'danger';
              const action = async () => {
                await handleDelete(item?.id);
              };
              confirmModal.show(title, message, confirmText, variant, action);
            }}
          />
        </div>
      ),
    },
  ], [confirmModal, handleDelete]);

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Attendance</h2>
        <div className={styles.headerActions}>
          <SearchBar
            placeholder="Search attendance"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton={isAllowed(PageName, 'w')}
            buttonLabel={isAllowed(PageName, 'w') ? "Add Attendance" : undefined}
            handleOnClick={isAllowed(PageName, 'w') ? () => { setEditing(null); setIsModalOpen(true); } : undefined}
            width="280px"
          />
        </div>
      </div>

      <div className={styles.tableSection}>
          <DataTable columns={tableColumns} data={filtered} showActions={false} emptyMessage="No attendance found" />
      </div>

      <ItemModal
        headerLabel={editing?.id ? 'Edit Attendance' : 'Add Attendance'}
        mode={editing?.id ? 'edit' : 'new'}
        itemIndex={editing?.id ? 0 : -1}
        isOpen={isModalOpen}
        fields={attendanceModalFields}
        onItemRemove={() => {}}
        onClose={isAllowed(PageName, 'w') ? async (value) => {
          if (!value) {
            setIsModalOpen(false);
            setEditing(null);
            return;
          }

          const selectedStaff = staffOptions.find((staff) => Number(staff.value) === Number(value.staffId));
          const payload = {
            name: value.name || selectedStaff?.name || '',
            code: value.code || selectedStaff?.code || '',
            staffId: Number(value.staffId) || 0,
            projectId: Number(projectId) || 0,
            date: value.date || '',
            clockIn: value.clockIn || '',
            clockOut: value.clockOut || '',
            hours: Number(value.hours) || 0,
            totalCost: Number(value.totalCost) || 0,
            overtimeApproved: Boolean(value.overtimeApproved),
            overtimeHours: Number(value.overtimeHours) || 0,
            deductLunchBreak: Boolean(value.deductLunchBreak),
          };

          if (!value.id || value.id === 0) {
            const response = await createAttendance(payload);
            if (response?.error) toast.error('Failed to add attendance');
            else { toast.success('Attendance added'); await loadData(); }
          } else {
            const response = await updateAttendance(value.id, payload);
            if (response?.error) toast.error('Failed to update attendance');
            else { toast.success('Attendance updated'); await loadData(); }
          }

          setIsModalOpen(false);
          setEditing(null);
        } : undefined}
        readOnly={!isAllowed(PageName, 'w')}
      />
    </div>
  );
}