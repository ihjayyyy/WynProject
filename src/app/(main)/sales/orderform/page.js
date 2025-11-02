import React, { Suspense } from 'react';
import SalesOrderForm from '@/components/Sales/SalesOrderForm/SalesOrderForm';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading form...</div>}>
      <SalesOrderForm />
    </Suspense>
  );
}
