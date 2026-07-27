import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProfileEditor from '@/components/ProfileEditor';

export default async function UserProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true, // Changed from image to avatarUrl
      createdAt: true,
      _count: {
        select: {
          registrations: true,
          events: true,
        },
      },
    },
  });

  if (!user) {
    redirect('/');
  }

  const role = user.role.toLowerCase();

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Profile</h1>
        <p className="text-neutral-400 mt-1">Manage your personal information and view platform permissions.</p>
      </div>

      <ProfileEditor user={{
        name: user.name || '',
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl // Pass avatarUrl to the component
      }} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Member Since</p>
          <p className="text-sm font-medium text-neutral-300">
            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Tickets Booked</p>
          <p className="text-sm font-medium text-neutral-300">{user._count.registrations} Events</p>
        </div>
        {role === 'organizer' && (
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Events Created</p>
            <p className="text-sm font-medium text-neutral-300">{user._count.events} Hosted</p>
          </div>
        )}
        {role === 'admin' && (
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Access Level</p>
            <p className="text-sm font-medium text-purple-400">Full System Control</p>
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold mb-4">Quick Links</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link 
          href="/dashboard/user" 
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-6 rounded-xl transition flex justify-between items-center group"
        >
          <div>
            <h4 className="font-bold text-base mb-1 group-hover:text-green-400 transition">My Ticket Dashboard</h4>
            <p className="text-xs text-neutral-400">View active entry QR codes and past events</p>
          </div>
          <span className="text-neutral-500 group-hover:text-white transition">→</span>
        </Link>

        {role === 'organizer' && (
          <Link 
            href="/dashboard/organizer" 
            className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-6 rounded-xl transition flex justify-between items-center group"
          >
            <div>
              <h4 className="font-bold text-base mb-1 group-hover:text-blue-400 transition">Organizer Dashboard</h4>
              <p className="text-xs text-neutral-400">Manage events, view analytics, and check-ins</p>
            </div>
            <span className="text-neutral-500 group-hover:text-white transition">→</span>
          </Link>
        )}

        {role === 'admin' && (
          <Link 
            href="/admin" 
            className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-6 rounded-xl transition flex justify-between items-center group"
          >
            <div>
              <h4 className="font-bold text-base mb-1 group-hover:text-purple-400 transition">Admin Panel</h4>
              <p className="text-xs text-neutral-400">Approve pending events and manage users</p>
            </div>
            <span className="text-neutral-500 group-hover:text-white transition">→</span>
          </Link>
        )}

        <Link 
          href="/" 
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-6 rounded-xl transition flex justify-between items-center group"
        >
          <div>
            <h4 className="font-bold text-base mb-1 group-hover:text-green-400 transition">Browse Public Events</h4>
            <p className="text-xs text-neutral-400">Explore new tech meetups and workshops</p>
          </div>
          <span className="text-neutral-500 group-hover:text-white transition">→</span>
        </Link>
      </div>
    </div>
  );
}