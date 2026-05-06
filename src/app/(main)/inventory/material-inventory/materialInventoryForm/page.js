'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialInventoryForm = dynamic(() => import("@/components/Inventory/MaterialInventoryForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialInventoryForm/>
    </Suspense>
  );
}