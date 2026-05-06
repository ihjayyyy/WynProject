'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const InquiryLanding = dynamic(() => import("@/components/Inquiry/InquiryLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <InquiryLanding/>
    </Suspense>
  );
}