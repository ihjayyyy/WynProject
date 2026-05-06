'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PurchaseOrdersForm = dynamic(() => import("@/components/PurchaseOrders/PurchaseOrdersForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <PurchaseOrdersForm/>
    </Suspense>
  );
}