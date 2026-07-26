import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link'; // <-- Added Link import

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/'); // Kick out non-admins
  }

  // Fetch only events that need approval
  const pendingEvents = await prisma.event.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' },
    include: {
      organizer: {
        select: { name: true, email: true } // Fetch who created it
      }
    }
  });

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Control Panel</h1>
        <p className="text-neutral-400 mt-1">Review and approve newly submitted events.</p>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center">
          <h3 className="text-xl text-white mb-2">All caught up!</h3>
          <p className="text-neutral-500">There are no pending events requiring your approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingEvents.map((event) => (
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
                  <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-bold">
                    PENDING
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition">{event.title}</h3>
                
                <div className="space-y-1 mb-6 text-sm">
                  <p className="text-neutral-400">
                    <span className="text-neutral-500">By:</span> {event.organizer?.name || 'Unknown'}
                  </p>
                  <p className="text-neutral-400">
                    <span className="text-neutral-500">Date:</span> {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="text-neutral-400">
                    <span className="text-neutral-500">Capacity:</span> {event.capacity}
                  </p>
                </div>

                <div className="mt-auto pt-4 border-t border-neutral-800 text-center">
                  <span className="text-sm font-semibold text-neutral-400 group-hover:text-white transition">
                    Click to Review & Approve →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}