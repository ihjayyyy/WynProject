'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const WarehouseForm = dynamic(() => import("@/components/Warehouse/WarehouseForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <WarehouseForm/>
    </Suspense>
  );
}