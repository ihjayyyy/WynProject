'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit2, FiEye } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing, { applyLandingFilters } from '../ui/Landing/Landing';
import { getSuppliers } from '../../services/Supplier';
import { useEffect } from 'react';

const baseColumns = [
  { header: 'Code', key: 'code' },
  { header: 'Company Name', key: 'name' },
  { header: 'Contact Person', key: 'contactPerson' },
  { header: 'Contact Number', key: 'contactNumber' },
  { header: 'Email', key: 'email' },
  { header: 'VAT Type', key: 'vatType' },
  { header: 'Terms', key: 'terms' },
  { header: 'Updated By', key: 'updatedBy' },
  { header: 'Updated Date', key: 'updatedAt', render: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' }) : '') },
];

export default function SuppliersLanding() {
  const [suppliers, setSuppliers] = useState([]);
  const [filterValues, setFilterValues] = useState({
    name: '',
    vatType: '',
    terms: '',
  });
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const res = await getSuppliers();
      if (!mounted) return;
      if (res.error || !res.data) {
        console.error('Failed to load suppliers', res.error);
        setSuppliers([]);
        return;
      }
      setSuppliers(res.data || []);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const actionItems = useMemo(
    () => [
      { key: 'view', label: 'View', icon: <FiEye size={14} />, onClick: (item) => router.push(`/suppliers/supplierform?id=${item.id}`) },
      { key: 'edit', label: 'Edit', icon: <FiEdit2 size={14} />, onClick: (item) => router.push(`/suppliers/supplierform?id=${item.id}&mode=edit`) },
    ],
    [router]
  );

  const columns = useMemo(() => {
    const cols = baseColumns.map((col) => {
      if (col.key === 'customerName') {
        return { ...col, render: (item) => item.customerName || '' };
      }
      if (col.key === 'isDeleted') {
        return { ...col, render: (item) => (item.isDeleted ? 'Yes' : 'No') };
      }
      return col;
    });
    return [...cols, { header: 'Action', key: 'actions', sortable: false, align: 'right', render: (item) => <DropdownAction item={item} items={actionItems} /> }];
  }, [actionItems]);

  const companyOptions = useMemo(() => {
    const uniqueCompanies = Array.from(
      new Set(suppliers.map((item) => String(item?.name || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return [{ label: 'All Companies', value: '' }, ...uniqueCompanies.map((company) => ({ label: company, value: company }))];
  }, [suppliers]);

  const vatTypeOptions = useMemo(() => {
    const uniqueVatTypes = Array.from(
      new Set(suppliers.map((item) => String(item?.vatType || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return [{ label: 'All VAT Types', value: '' }, ...uniqueVatTypes.map((vatType) => ({ label: vatType, value: vatType }))];
  }, [suppliers]);

  const termsOptions = useMemo(() => {
    const uniqueTerms = Array.from(
      new Set(suppliers.map((item) => String(item?.terms || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return [{ label: 'All Terms', value: '' }, ...uniqueTerms.map((terms) => ({ label: terms, value: terms }))];
  }, [suppliers]);

  const landingFilters = useMemo(
    () => [
      {
        key: 'name',
        label: 'Company',
        type: 'select',
        options: companyOptions,
        placeholder: 'All Companies',
        accessor: (item) => item?.name,
        match: 'equals',
      },
      {
        key: 'vatType',
        label: 'VAT Type',
        type: 'select',
        options: vatTypeOptions,
        placeholder: 'All VAT Types',
        accessor: (item) => item?.vatType,
        match: 'equals',
      },
      {
        key: 'terms',
        label: 'Terms',
        type: 'select',
        options: termsOptions,
        placeholder: 'All Terms',
        accessor: (item) => item?.terms,
        match: 'equals',
      },
    ],
    [companyOptions, vatTypeOptions, termsOptions]
  );

  const filteredSuppliers = useMemo(
    () => applyLandingFilters(suppliers, landingFilters, filterValues),
    [suppliers, landingFilters, filterValues]
  );

  const supplierStats = useMemo(() => {
    const total = filteredSuppliers.length;
    return [
      { key: 'total', label: 'Total Suppliers', number: total, change: `${total} records`, isPositive: true },
    ];
  }, [filteredSuppliers]);

  const hasActiveFilters = Object.values(filterValues).some((value) => String(value || '').trim() !== '');

  const clearFilters = useCallback(() => {
    setFilterValues({ name: '', vatType: '', terms: '' });
  }, []);

  const filterFn = (item, keyword) => {
    return [
      item.id,
      item.contactPerson,
      item.contactNumber,
      item.code,
      item.name,
      item.email,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  };

  return (
    <Landing
      title="Suppliers"
      data={suppliers}
      columns={columns}
      stats={supplierStats}
      searchPlaceholder="Search supplier"
      newButtonLabel="New Supplier"
      onNew={() => router.push('/suppliers/supplierform')}
      emptyMessage={hasActiveFilters ? 'No suppliers found for the selected filters' : 'No suppliers found'}
      width="320px"
      filterFn={filterFn}
      filters={landingFilters}
      filterValues={filterValues}
      onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
      onClearFilters={clearFilters}
      hasActiveFilters={hasActiveFilters}
    />
  );
}