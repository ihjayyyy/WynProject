import React, { Suspense } from 'react';
import SalesQuotationForm from '@/components/Sales/SalesQuotationForm/SalesQuotationForm';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading form...</div>}>
      <SalesQuotationForm />
    </Suspense>
  );
}
