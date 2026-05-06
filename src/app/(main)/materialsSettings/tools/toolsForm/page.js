'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ToolsForm = dynamic(() => import("@/components/Materials/ToolsForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <ToolsForm/>
    </Suspense>
  );
}