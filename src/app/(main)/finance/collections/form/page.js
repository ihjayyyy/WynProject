'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const CollectionForm = dynamic(() => import("@/components/Collection/CollectionForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <CollectionForm/>
    </Suspense>
  );
}