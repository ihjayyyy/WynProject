import React, { Suspense } from 'react';
import InventoryFormClient from '@/components/InventoryForm/InventoryFormClient';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading form...</div>}>
      <InventoryFormClient />
    </Suspense>
  );
}
