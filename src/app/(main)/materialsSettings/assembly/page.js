'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const AssemblyLanding = dynamic(() => import("@/components/Materials/AssemblyLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <AssemblyLanding/>
    </Suspense>
  );
}