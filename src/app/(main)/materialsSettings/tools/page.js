'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ToolsLanding = dynamic(() => import("@/components/Materials/ToolsLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <ToolsLanding/>
    </Suspense>
  );
}