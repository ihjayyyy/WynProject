"use client";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialReceivedForm = dynamic(() => import('@/components/MaterialReceive/MaterialReceivedForm'), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialReceivedForm />
    </Suspense>
  );
}
