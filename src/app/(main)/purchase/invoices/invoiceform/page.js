'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PurchaseInvoiceForm = dynamic(() => import("@/components/Invoice/InvoiceForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <PurchaseInvoiceForm/>
    </Suspense>
  );
}