'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const CollectionLanding = dynamic(() => import("@/components/Collection/CollectionLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <CollectionLanding/>
    </Suspense>
  );
}