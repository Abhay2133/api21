import './globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'apps21 Admin | System Control Panel',
  description: 'Administrative dashboard, system metrics, terminal console, and deployment inspector for apps21',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#090d16] text-slate-100 font-sans antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
