'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PRLanding = dynamic(() => import("@/components/PurchaseRequests/PRLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <PRLanding/>
    </Suspense>
  );
}