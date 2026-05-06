'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const SalesBillingForm = dynamic(() => import("@/components/SalesBilling/SalesBillingForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <SalesBillingForm/>
    </Suspense>
  );
}