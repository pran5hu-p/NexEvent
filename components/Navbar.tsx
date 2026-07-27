'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const user = session?.user;
  const role = user?.role?.toLowerCase() || 'customer';

  // Dynamic role badge styling
  const getRoleBadgeStyle = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'organizer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-green-500/10 text-green-400 border-green-500/30';
    }
  };

  // Determine the correct dashboard path based on role
  const getDashboardPath = (userRole: string) => {
    switch (userRole) {
      case 'admin': return '/dashboard/admin';
      case 'organizer': return '/dashboard/organizer';
      default: return '/dashboard/user';
    }
  };

  return (
    <nav className="bg-neutral-950/80 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Brand Logo Section */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform duration-300">
              <span className="text-black font-black text-2xl">N</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight group-hover:text-neutral-200 transition-colors">
              NexEvent
            </span>
          </Link>

          {/* Navigation Links & Auth Actions */}
          <div className="flex items-center gap-6">
            {!loading && !session && (
              <div className="flex items-center gap-4">
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-bold text-black bg-white px-5 py-2.5 rounded-xl hover:bg-neutral-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg shadow-white/10"
                >
                  Sign up
                </Link>
              </div>
            )}

            {!loading && session && (
              <div className="flex items-center gap-5">
                
                {/* Dashboard Quick Link */}
                <Link 
                  href={getDashboardPath(role)} 
                  className="hidden sm:block text-sm font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>

                <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

                {/* Clickable Profile Pill */}
                <Link 
                  href="/dashboard/profile"
                  className="flex items-center gap-3 bg-neutral-900/50 hover:bg-neutral-800 border border-white/5 hover:border-white/20 pl-2 pr-4 py-1.5 rounded-full transition-all duration-300 group"
                  title="Go to Profile"
                >
                  {/* Avatar Circle */}
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:bg-neutral-700 transition-colors overflow-hidden">
                    {(user?.image ?? user?.avatarUrl) ? (
                      <img 
                        src={(user.image ?? user.avatarUrl) || ''} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  
                  {/* Name and Role Badge */}
                  <div className="flex flex-col justify-center items-center hidden md:flex">
                    <span className="text-sm font-bold text-white leading-tight">
                      {user?.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border leading-none tracking-wide ${getRoleBadgeStyle(role)}`}>
                        {role}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Styled Logout Button */}
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-sm font-medium text-neutral-400 hover:text-red-400 bg-neutral-900/50 border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-all duration-200"
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