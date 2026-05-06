'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const SuppliersForm = dynamic(() => import("@/components/Suppliers/SuppliersForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <SuppliersForm/>
    </Suspense>
  );
}