'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UsersForm = dynamic(() => import('@/components/Users/UsersForm'), {
  ssr: false,
});

export default function Page() {
  return (
    <div>
      <Suspense fallback="Loading...">
        <UsersForm />
      </Suspense>
    </div>
  );
}
