'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const RolesForm = dynamic(() => import('@/components/Roles/RolesForm'), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <RolesForm />
    </Suspense>
  );
}
