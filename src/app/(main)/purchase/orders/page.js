'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const OrdersLanding = dynamic(() => import("@/components/PurchaseOrders/PurchaseOrdersLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <OrdersLanding/>
    </Suspense>
  );
}