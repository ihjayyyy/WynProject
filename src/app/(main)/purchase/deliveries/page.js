'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const DeliveryLanding = dynamic(() => import("@/components/PurchaseDelivery/DeliveryLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <DeliveryLanding/>
    </Suspense>
  );
}