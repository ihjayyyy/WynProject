'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const InventoryMovementLanding = dynamic(() => import('@/components/Inventory/InventoryMovementLanding'), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <InventoryMovementLanding />
    </Suspense>
  );
}