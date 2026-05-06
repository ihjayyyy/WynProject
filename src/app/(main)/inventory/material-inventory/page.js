'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialInventoryLanding = dynamic(() => import("@/components/Inventory/MaterialInventoryLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialInventoryLanding/>
    </Suspense>
  );
}