'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UserProfile = dynamic(() => import('@/components/UserProfile/UserProfile'), {
  ssr: false,
});

export default function Page() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <UserProfile />
      </Suspense>
    </div>
  );
}
