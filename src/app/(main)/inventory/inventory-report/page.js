'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialInventoryReportLanding = dynamic(
  () => import('@/components/Inventory/MaterialInventoryReportLanding'),
  { ssr: false }
);

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialInventoryReportLanding />
    </Suspense>
  );
}