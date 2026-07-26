import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

// Ensures the homepage always fetches the latest events and doesn't aggressively cache
export const dynamic = 'force-dynamic'; 

export default async function PublicFeedPage() {
  // 1. Fetch only events that are 'approved' and happening in the future
  const events = await prisma.event.findMany({
    where: { 
      status: 'approved',
    },
    orderBy: { date: 'asc' }, // Show closest dates first
    include: {
      organizer: {
        select: { name: true } // Grab the organizer's name
      }
    }
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="py-20 px-6 text-center border-b border-neutral-800 bg-neutral-900/30">
        <h1 className="text-5xl font-extrabold text-white mb-4">
          Discover <span className="text-green-500">Next-Gen</span> Events
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          Browse and register for the best  meetups, hackathons, and exclusive gatherings happening near you.
        </p>
      </div>

      {/* Event Grid */}
      <div className="max-w-7xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-white mb-8">Upcoming Events</h2>
        
        {events.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-800 rounded-2xl">
            <h3 className="text-xl text-neutral-400">No upcoming events right now.</h3>
            <p className="text-neutral-500 mt-2">Check back later for new experiences!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id} className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-600 transition duration-300">
                
                {/* Image Container */}
                <div className="relative h-56 w-full bg-neutral-800 overflow-hidden">
                  {event.posterUrl ? (
                    <Image 
                      src={event.posterUrl} 
                      alt={event.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-600">
                      NexEvent
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-2">
                    {event.category}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{event.title}</h3>
                  <p className="text-neutral-400 text-sm mb-6 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-center text-sm text-neutral-500">
                    <span>📍 {event.location}</span>
                    <span>By {event.organizer?.name || 'Organizer'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}