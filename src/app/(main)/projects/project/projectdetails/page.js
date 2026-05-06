'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ProjectDetails = dynamic(() => import("@/components/Project/ProjectDetails"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      return <ProjectDetails/>;
    </Suspense>
  );
}