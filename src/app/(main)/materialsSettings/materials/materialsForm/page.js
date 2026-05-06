'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialsForm = dynamic(() => import("@/components/Materials/MaterialsForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialsForm/>
    </Suspense>
  );
}