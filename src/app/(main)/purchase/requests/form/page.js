'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PRForm = dynamic(() => import("@/components/PurchaseRequests/PRForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <PRForm/>
    </Suspense>
  );
}