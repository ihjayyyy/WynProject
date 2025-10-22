import React, { Suspense } from 'react';
import SupplierFormClient from '@/components/SupplierForm/SupplierFormClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading form...</div>}>
      <SupplierFormClient />
    </Suspense>
  );
}
