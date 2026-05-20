'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialTransferLanding = dynamic(() => import("@/components/MaterialTransfer/MaterialTransferLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialTransferLanding/>
    </Suspense>
  );
}