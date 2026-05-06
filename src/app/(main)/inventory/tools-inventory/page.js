'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ToolsInventoryLanding = dynamic(() => import("@/components/Inventory/ToolsInventoryLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <ToolsInventoryLanding/>
    </Suspense>
  );
}