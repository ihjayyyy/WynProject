'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ProposalForm = dynamic(() => import("@/components/Proposal/ProposalForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <ProposalForm/>
    </Suspense>
  );
}