'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const CustomersForm = dynamic(() => import("@/components/Customers/CustomersForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <CustomersForm/>
    </Suspense>
  );
}