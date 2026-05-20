'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialTransferForm = dynamic(() => import("@/components/MaterialTransfer/MaterialTransferForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialTransferForm/>
    </Suspense>
  );
}