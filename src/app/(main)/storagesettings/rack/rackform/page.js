'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const RackForm = dynamic(() => import("@/components/Rack/RackForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <RackForm/>
    </Suspense>
  );
}