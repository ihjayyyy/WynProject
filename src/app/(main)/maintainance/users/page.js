'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UsersLanding = dynamic(() => import('@/components/Users/UsersLanding'), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <UsersLanding />
    </Suspense>
  );
}
