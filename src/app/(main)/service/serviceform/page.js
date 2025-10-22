import React, { Suspense } from 'react';
import ServiceFormClient from '@/components/ServiceForm/ServiceFormClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading form...</div>}>
      <ServiceFormClient />
    </Suspense>
  );
}
