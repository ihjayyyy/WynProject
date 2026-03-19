'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import { sampleEmployees } from './employeesData';

const baseColumns = [
  { header: 'Id', key: 'id' },
  { header: 'Code', key: 'code' },
  { header: 'First Name', key: 'firstName' },
  { header: 'Last Name', key: 'lastName' },
  { header: 'Position', key: 'position' },
  { header: 'Department', key: 'department' },
  { header: 'Contact', key: 'contactNumber' },
  { header: 'Email', key: 'email' },
  { header: 'UpdatedBy', key: 'updatedBy' },
  { header: 'UpdatedDate', key: 'updatedDate' },
];

export default function EmployeesLanding() {
  const [employees] = useState(sampleEmployees);
  const router = useRouter();

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/employees/employeesform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/employees/employeesform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => [...baseColumns, { header: 'Action', key: 'actions', align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }], [actionItems]);

  const employeeStats = useMemo(() => {
    const total = employees.length;
    const departments = new Set(employees.map((i) => i.department).filter(Boolean)).size;
    const withEmail = employees.filter((i) => i.email).length;
    const withContact = employees.filter((i) => i.contactNumber).length;
    return [
      { key: 'total', label: 'Total Employees', number: total, change: `${total} records`, isPositive: true },
      { key: 'departments', label: 'Departments', number: departments, change: `${departments} unique`, isPositive: true },
      { key: 'email', label: 'With Email', number: withEmail, change: `${withEmail}/${total || 0}`, isPositive: true },
      { key: 'contact', label: 'With Contact', number: withContact, change: `${withContact}/${total || 0}`, isPositive: true },
    ];
  }, [employees]);

  const filterFn = (item, keyword) => {
    return [
      item.id,
      item.createdBy,
      item.createdDate,
      item.updatedBy,
      item.updatedDate,
      item.code,
      item.firstName,
      item.lastName,
      item.position,
      item.department,
      item.contactNumber,
      item.address,
      item.email,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Employees"
      data={employees}
      columns={columns}
      stats={employeeStats}
      searchPlaceholder="Search employee"
      newButtonLabel="New Employee"
      onNew={() => router.push('/employees/employeesform')}
      emptyMessage="No employees found"
      width="320px"
      filterFn={filterFn}
    />
  );
}
