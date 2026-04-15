'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../ui/DataTable/DataTable';
import SearchBar from '../ui/SearchBar/SearchBar';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import AttendanceModal from './AttendanceModal';
import styles from './ProjectScope.module.scss';
import { FiEdit2 } from 'react-icons/fi';
import { getAttendanceByProjectId, createAttendance, updateAttendance } from '../../services/Attendance';
import { getStaffs } from '../../services/Staff';
import { useToast } from '../ui/Toast/Toast';

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
  end.setDate(start.getDate() + 4);

  const cappedEnd = today < end ? today : end;

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(cappedEnd),
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
  const [defaultDateRange] = useState(getCurrentWorkingWeek);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [startDate, setStartDate] = useState(defaultDateRange.startDate);
  const [endDate, setEndDate] = useState(defaultDateRange.endDate);
  const toast = useToast();

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
        </div>
      ),
    },
  ], []);

  return (
    <div className={styles.landingWrap}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Attendance</h2>
        <div className={styles.headerActions}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="attendance-start-date">Start Date</label>
              <Input id="attendance-start-date" type="date" value={startDate} aria-label="Start Date" onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="attendance-end-date">End Date</label>
              <Input id="attendance-end-date" type="date" value={endDate} aria-label="End Date" onChange={(event) => setEndDate(event.target.value)} />
            </div>
          </div>
          <SearchBar
            placeholder="Search attendance"
            value={searchTerm}
            onChange={setSearchTerm}
            showFilter={false}
            showButton
            buttonLabel="Add Attendance"
            handleOnClick={() => { setEditing(null); setIsModalOpen(true); }}
            width="240px"
          />
        </div>
      </div>

      <div className={styles.tableSection}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No attendance records for this project</div>
        ) : (
          <DataTable columns={tableColumns} data={filtered} showActions={false} emptyMessage="No attendance found" />
        )}
      </div>

      <AttendanceModal
        open={isModalOpen}
        initial={editing || {}}
        staffOptions={staffOptions}
        projectId={projectId}
        onCancel={() => { setIsModalOpen(false); setEditing(null); }}
        onConfirm={async (value) => {
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
        }}
      />
    </div>
  );
}