'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const InvoicesLanding = dynamic(() => import("@/components/Invoice/InvoicesLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <InvoicesLanding/>
    </Suspense>
  );
}