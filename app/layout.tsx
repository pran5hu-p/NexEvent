import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers'; // <-- New
import Navbar from '@/components/Navbar';       // <-- New

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NexEvent',
  description: 'Event Management Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-950 text-white min-h-screen`}>
        <Providers>
          <Toaster position="bottom-right" />
          <Navbar />
          {/* This renders whatever page the user is currently on */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}