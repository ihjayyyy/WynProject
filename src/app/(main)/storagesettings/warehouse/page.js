'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const WarehouseLanding = dynamic(() => import("@/components/Warehouse/WarehouseLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <WarehouseLanding/>
    </Suspense>
  );
}