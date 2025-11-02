import React, { Suspense } from 'react';
import OrderForm from '@/components/Purchase/OrderForm/OrderForm';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading form...</div>}>
      <OrderForm />
    </Suspense>
  );
}