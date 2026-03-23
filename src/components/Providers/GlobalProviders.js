"use client";

import React from 'react';
import { ToastProvider } from '../ui/Toast/Toast';

export default function GlobalProviders({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
