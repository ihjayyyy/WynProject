import { Inter } from "next/font/google";
import "./globals.scss";
import GlobalProviders from "../components/Providers/GlobalProviders";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "WynProject",
  description: "WynProject Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
