'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import("@/components/Dashboard/Dashboard"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <Dashboard/>
    </Suspense>
  );
}