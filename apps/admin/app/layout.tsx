import './globals.css';
import React from 'react';

export const metadata = {
  title: 'api21 Admin | System Control Plane',
  description: 'Administrative dashboard, system metrics, terminal console, and deployment inspector for api21',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
