'use client';

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import DropdownAction from '../ui/DropdownAction/DropdownAction';
import Landing from '../ui/Landing/Landing';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import Input from '../ui/Input/Input';
import InvalidPage from '../InvalidPage/page';
import { getAllParameters, updateParameter } from '@/services/Parameter';
import { AccessContext } from '@/app/contextProviders/accessContext';
import styles from './ParameterLanding.module.scss';

export default function ParameterLanding() {
  const { isAllowed } = useContext(AccessContext);
  const pageName = 'Maintenance.Parameters';
  const canRead = isAllowed(pageName, 'r');
  const canWrite = isAllowed(pageName, 'w');
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParameter, setSelectedParameter] = useState(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getAllParameters().then((res) => {
      if (!mounted) return;
      setParameters(Array.isArray(res.data) ? res.data : []);
      setError(res.error || '');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const openEdit = (parameter) => {
    setSelectedParameter(parameter);
    setValue(parameter.value == null ? '' : String(parameter.value));
    setError('');
  };

  const closeEdit = () => {
    if (saving) return;
    setSelectedParameter(null);
    setError('');
  };

  const saveValue = async () => {
    if (!selectedParameter || saving) return;
    setSaving(true);
    const result = await updateParameter(selectedParameter.id, {
      ...selectedParameter,
      value,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setParameters((current) => current.map((parameter) => (
      parameter.id === selectedParameter.id ? { ...parameter, value } : parameter
    )));
    setSelectedParameter(null);
    setError('');
  };

  const actions = useMemo(() => [
    { key: 'edit', label: 'Edit value', icon: <FiEdit2 size={14} />, onClick: openEdit },
  ], []);

  const columns = useMemo(() => [
    { header: 'Module', key: 'module' },
    { header: 'Name', key: 'name' },
    { header: 'Code', key: 'code' },
    { header: 'Value', key: 'value' },
    ...(canWrite ? [{
      header: 'Action',
      key: 'actions',
      sortable: false,
      align: 'right',
      render: (item) => <DropdownAction item={item} items={actions} />,
    }] : []),
  ], [actions, canWrite]);

  const stats = useMemo(() => [{
    key: 'total',
    label: 'Total Parameters',
    number: parameters.length,
    change: `${parameters.length} records`,
    isPositive: true,
  }], [parameters.length]);

  if (!canRead) return <InvalidPage />;

  return (
    <>
      <Landing
        title="Parameters"
        data={parameters}
        columns={columns}
        stats={stats}
        searchPlaceholder="Search parameters"
        emptyMessage="No parameters found"
        loading={loading}
        filterFn={(parameter, keyword) => [parameter.module, parameter.name, parameter.code, parameter.value]
          .some((entry) => String(entry ?? '').toLowerCase().includes(keyword))}
      />
      <ConfirmModal
        open={Boolean(selectedParameter)}
        title="Edit parameter value"
        message={`${selectedParameter?.module || ''} / ${selectedParameter?.name || ''}`}
        confirmText={saving ? 'Saving...' : 'Save'}
        cancelText="Cancel"
        onConfirm={saveValue}
        onCancel={closeEdit}
      >
        <Input
          id="parameter-value"
          label="Value"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
        />
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </ConfirmModal>
    </>
  );
}