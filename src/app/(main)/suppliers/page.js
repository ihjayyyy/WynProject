'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const SuppliersLanding = dynamic(() => import("@/components/Suppliers/SuppliersLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <SuppliersLanding/>
    </Suspense>
  );
}