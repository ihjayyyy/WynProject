'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialRequestForm = dynamic(() => import("@/components/Inventory/MaterialRequest/MaterialRequestForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialRequestForm/>
    </Suspense>
  );
}