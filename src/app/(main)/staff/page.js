'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const StaffLanding = dynamic(() => import("@/components/Staff/StaffLanding"), { ssr: false });

export default function StaffPage() {
  return (
    <Suspense fallback={"Loading..."}>
      <StaffLanding/>
    </Suspense>
  );
}