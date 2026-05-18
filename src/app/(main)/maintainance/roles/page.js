'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const RolesLanding = dynamic(() => import('@/components/Roles/RolesLanding'), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <RolesLanding />
    </Suspense>
  );
}
