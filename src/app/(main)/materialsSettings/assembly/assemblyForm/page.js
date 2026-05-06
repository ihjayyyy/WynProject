'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const AssemblyForm = dynamic(() => import("@/components/Materials/AssemblyForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <AssemblyForm/>
    </Suspense>
  );
}