'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ProposalLanding = dynamic(() => import("@/components/Proposal/ProposalLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <ProposalLanding/>
    </Suspense>
  );
}