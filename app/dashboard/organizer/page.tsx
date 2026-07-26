import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default async function OrganizerDashboard() {
  // 1. Authenticate the user on the server
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user.role !== 'organizer' && session.user.role !== 'admin')) {
    redirect('/'); // Kick out unauthorized users
  }

  // 2. Fetch only the events created by this specific organizer
  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { registrations: { where: { status: { not: 'cancelled' } } } }
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
          <p className="text-neutral-400 mt-1">Manage your events and track live check-ins.</p>
        </div>
        <Link 
          href="/dashboard/organizer/events/create" 
          className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-neutral-200 transition"
        >
          + Create New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <h3 className="text-xl text-white mb-2">No events yet</h3>
          <p className="text-neutral-500">You haven't created any events. Click the button above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
              {/* Poster Image */}
              <div className="relative h-48 w-full bg-neutral-800">
                {event.posterUrl ? (
                  <Image 
                    src={event.posterUrl} 
                    alt={event.title} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-600">
                    No Poster
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    event.status.trim().toLowerCase() === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    event.status.trim().toLowerCase() === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {event.status.trim().toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-1">{event.title}</h3>
                <p className="text-sm text-neutral-400 mb-4">{new Date(event.date).toLocaleDateString()}</p>
                
                <div className="flex justify-between items-center text-sm text-neutral-300 bg-neutral-800/50 p-3 rounded-lg mb-4">
                  <span>Registrations</span>
                  <span className="font-mono">{event._count.registrations} / {event.capacity}</span>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-neutral-800">
                  {event.status.trim().toLowerCase() === 'approved' ? (
                    <Link 
                      href={`/dashboard/organizer/events/${event.id}/checkin`}
                      className="block text-center w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg transition"
                    >
                      Open Live Scanner
                    </Link>
                  ) : (
                    <button disabled className="w-full bg-neutral-900 text-neutral-600 py-2 rounded-lg cursor-not-allowed border border-neutral-800">
                      Awaiting Approval
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}