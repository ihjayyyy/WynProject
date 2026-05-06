'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ToolsInventoryForm = dynamic(() => import("@/components/Inventory/ToolsInventoryForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <ToolsInventoryForm/>
    </Suspense>
  );
}