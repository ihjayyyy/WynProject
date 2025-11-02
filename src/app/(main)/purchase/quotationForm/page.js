import React, { Suspense } from 'react';
import QuotationForm from '@/components/Purchase/QuotationForm/QuotationForm';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading form...</div>}>
      <QuotationForm />
    </Suspense>
  );
}
