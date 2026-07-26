import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default async function OrganizerDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'organizer') {
    redirect('/'); // Kick out non-organizers
  }

  // Fetch events created by this specific organizer
  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
          <p className="text-neutral-400 mt-1">Manage your created events and track check-ins.</p>
        </div>
        <Link 
          href="/dashboard/organizer/events/create" 
          className="bg-green-500 hover:bg-green-600 text-black font-bold px-5 py-2.5 rounded-xl transition"
        >
          + Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <h3 className="text-xl text-white mb-2">No events created yet</h3>
          <p className="text-neutral-500 mb-6">Get started by hosting your first tech meetup or hackathon.</p>
          <Link 
            href="/dashboard/organizer/events/create" 
            className="inline-block bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-6 py-3 rounded-xl transition border border-neutral-700"
          >
            Create Your First Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            // Determine status badge styling
            const isApproved = event.status === 'approved';
            const statusClass = isApproved 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

            return (
              <Link 
                href={`/events/${event.id}`} 
                key={event.id} 
                className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col hover:border-neutral-600 transition duration-200 group"
              >
                
                <div className="relative h-48 w-full bg-neutral-800">
                  {event.posterUrl ? (
                    <Image 
                      src={event.posterUrl} 
                      alt={event.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-600">
                      No Poster
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`border px-3 py-1 rounded-full text-xs font-bold uppercase ${statusClass}`}>
                      {event.status}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition">{event.title}</h3>
                  
                  <div className="space-y-1 mb-6 text-sm">
                    <p className="text-neutral-400">
                      <span className="text-neutral-500">Date:</span> {new Date(event.date).toLocaleDateString()}
                    </p>
                    <p className="text-neutral-400">
                      <span className="text-neutral-500">Location:</span> {event.location}
                    </p>
                    <p className="text-neutral-400">
                      <span className="text-neutral-500">Capacity:</span> {event.capacity}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-neutral-800 text-center">
                    <span className="text-sm font-semibold text-neutral-400 group-hover:text-white transition">
                      {isApproved ? 'Open Event & Scanner →' : 'View Pending Status →'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}