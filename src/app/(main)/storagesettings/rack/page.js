'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const RackLanding = dynamic(() => import("@/components/Rack/RackLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <RackLanding/>
    </Suspense>
  );
}