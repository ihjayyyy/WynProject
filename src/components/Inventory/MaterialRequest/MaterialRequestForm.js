'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiFileText } from 'react-icons/fi';
import EntityForm from '../EntityForm/EntityForm';
import { INITIAL_MATERIAL_REQUEST, getMaterialRequests } from '../../services/MaterialRequest';

export default function MaterialRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('id');
  const [initialValues, setInitialValues] = useState(INITIAL_MATERIAL_REQUEST);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!requestId) return;
      try {
        const res = await getMaterialRequests();
        if (!cancelled && !res?.error && res.data) {
          const found = res.data.find((r) => String(r.id) === String(requestId));
          if (found) setInitialValues(found);
        }
      } catch (e) {}
    })();
    return () => { cancelled = true; };
  }, [requestId]);

  const fields = [
    { name: 'name', label: 'Name', span: 'span2', readOnly: true },
    { name: 'code', label: 'Code', span: 'span2', readOnly: true },
    { name: 'materialId', label: 'Material', span: 'span1', readOnly: true },
    { name: 'projectId', label: 'Project', span: 'span1', readOnly: true },
    { name: 'qty', label: 'Qty', type: 'number', span: 'span1', readOnly: true },
    { name: 'requestedBy', label: 'Requested By', span: 'span1', readOnly: true },
    { name: 'status', label: 'Status', span: 'span1', readOnly: true },
    { name: 'requestDate', label: 'Request Date', span: 'span1', readOnly: true },
    { name: 'deadline', label: 'Deadline', span: 'span1', readOnly: true },
    { name: 'reasonOrProject', label: 'Reason/Project', span: 'span2', readOnly: true },
    { name: 'responseBy', label: 'Response By', span: 'span1', readOnly: true },
    { name: 'responseDate', label: 'Response Date', span: 'span1', readOnly: true },
  ];

  return (
    <EntityForm
      title="View Material Request"
      icon={<FiFileText />}
      fields={fields}
      initialValues={initialValues}
      readOnly
      hideSubmit
      onCancel={() => router.push('/inventory/material-request')}
    />
  );
}
