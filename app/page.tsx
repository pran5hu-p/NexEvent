import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const { search, category } = await searchParams;

  // Build dynamic filter conditions
  const whereClause: any = {
    status: 'approved', // Only show approved events on the public feed
  };

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category && category !== 'All') {
    whereClause.category = category;
  }

  // Fetch filtered events
  const events = await prisma.event.findMany({
    where: whereClause,
    orderBy: { date: 'asc' },
    include: { organizer: { select: { name: true } } },
  });

  // Fetch unique categories for filter chips
  const categoriesRaw = await prisma.event.findMany({
    where: { status: 'approved' },
    select: { category: true },
    distinct: ['category'],
  });
  const categories = ['All', ...categoriesRaw.map((e) => e.category)];

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 text-white">
      {/* Hero Section */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold mb-3">Discover Amazing Events</h1>
        <p className="text-neutral-400">Find and register for the latest tech meetups, workshops, and hackathons.</p>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center">
        {/* Search Bar */}
        <form method="GET" className="w-full md:w-1/2">
          <input 
            type="text" 
            name="search" 
            defaultValue={search || ''} 
            placeholder="Search events by title or location..." 
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-green-500 transition"
          />
        </form>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
          {categories.map((cat) => {
            const isActive = (!category && cat === 'All') || category === cat;
            return (
              <Link
                key={cat}
                href={`/?${search ? `search=${search}&` : ''}category=${cat}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  isActive 
                    ? 'bg-green-500 text-black border-green-500' 
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {cat}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <h3 className="text-xl font-bold mb-2">No events found</h3>
          <p className="text-neutral-500 mb-6">Try adjusting your search terms or category filters.</p>
          <Link 
            href="/" 
            className="inline-block bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-5 py-2.5 rounded-xl transition border border-neutral-700 text-sm"
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
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
                  <div className="flex items-center justify-center h-full text-neutral-600 text-sm">
                    No Poster
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className="bg-neutral-900/80 backdrop-blur-md text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {event.category}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold mb-2 group-hover:text-green-400 transition">{event.title}</h3>
                
                <div className="space-y-1 mb-6 text-sm">
                  <p className="text-neutral-400">
                    <span className="text-neutral-500">📅</span> {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="text-neutral-400">
                    <span className="text-neutral-500">📍</span> {event.location}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-neutral-800 flex justify-between items-center text-sm">
                  <span className="text-neutral-400 text-xs">By {event.organizer?.name || 'Organizer'}</span>
                  <span className="font-semibold text-white group-hover:text-green-400 transition">View Details →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}