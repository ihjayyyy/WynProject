'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialReceivedLanding = dynamic(() => import("@/components/MaterialReceive/MaterialReceivedLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialReceivedLanding/>
    </Suspense>
  );
}