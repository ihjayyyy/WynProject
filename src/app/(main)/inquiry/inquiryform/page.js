'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const InquiryForm = dynamic(() => import("@/components/Inquiry/InquiryForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <InquiryForm/>
    </Suspense>
  );
}