'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const StaffForm = dynamic(() => import('@/components/Staff/StaffForm'), { ssr: false });

export default function StaffFormPage() {
  return (
    <Suspense fallback={"Loading..."}>
      <StaffForm/>
    </Suspense>
  );
}