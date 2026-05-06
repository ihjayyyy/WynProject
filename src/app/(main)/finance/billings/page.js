'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const SalesBillingLanding = dynamic(() => import("@/components/SalesBilling/SalesBillingLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <SalesBillingLanding/>
    </Suspense>
  );
}