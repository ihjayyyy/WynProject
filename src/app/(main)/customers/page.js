'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const CustomersLanding = dynamic(() => import("@/components/Customers/CustomersLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <CustomersLanding/>
    </Suspense>
  );
}