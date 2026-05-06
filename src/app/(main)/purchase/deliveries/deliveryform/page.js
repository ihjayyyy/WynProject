'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PurchaseDeliveryForm = dynamic(() => import("@/components/PurchaseDelivery/DeliveryForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <PurchaseDeliveryForm/>
    </Suspense>
  );
}