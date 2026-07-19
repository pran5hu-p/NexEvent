'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  return (
    <nav className="bg-neutral-950/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-black font-bold text-xl">N</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">NexEvent</span>
          </Link>

          {/* Navigation Links & Auth Buttons */}
          <div className="flex items-center gap-6">
            {!loading && !session && (
              <>
                <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="text-sm font-medium text-black bg-white px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors">
                  Sign up
                </Link>
              </>
            )}

            {!loading && session && (
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium text-white">{session.user?.name}</span>
                  <span className="text-xs text-neutral-400 capitalize">{session.user?.role}</span>
                </div>
                
                {/* Role-based Dashboard Link */}
                {session.user?.role === 'organizer' && (
                  <Link href="/dashboard" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                    Dashboard
                  </Link>
                )}

                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-sm font-medium text-white bg-neutral-800 border border-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}