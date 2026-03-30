import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/app/globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Budgetly",
  description: "Private family finance workspace for a two-person household."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <AppProviders>
          <ServiceWorkerRegister />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
