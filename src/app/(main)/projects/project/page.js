'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ProjectLanding = dynamic(() => import("@/components/Project/ProjectLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <ProjectLanding/>
    </Suspense>
  );
}