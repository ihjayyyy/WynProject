import React from "react";
import SidenavLayout from '../../components/SidenavLayout/SidenavLayout';
import { Geist, Geist_Mono } from "next/font/google";
import { AccessProvider } from '../contextProviders/accessContext';
import '../globals.scss';
import { ConfirmModalProvider } from "../contextProviders/confirmModalContext";
import AuthGuard from '../../components/Providers/AuthGuard';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WynProject",
  description: "WynProject Management System",
};

export default function MainLayout({ children }) {
  return (
    <AuthGuard>
      <AccessProvider>
        <ConfirmModalProvider>
          <div className={`${geistSans.variable} ${geistMono.variable}`}>
            <SidenavLayout>{children}</SidenavLayout>
          </div>
        </ConfirmModalProvider>
      </AccessProvider>
    </AuthGuard>
  );
}
