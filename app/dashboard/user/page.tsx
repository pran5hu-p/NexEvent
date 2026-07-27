import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import QRCodeWrapper from '@/components/QRCodeWrapper';
import CancelTicketButton from '@/components/CancelTicketButton' // Client component for cancellation

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const registrations = await prisma.registration.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          posterUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Tickets</h1>
        <p className="text-neutral-400 mt-1">View your registered events, entry QR codes, or cancel bookings.</p>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <h3 className="text-xl font-bold mb-2">No tickets found</h3>
          <p className="text-neutral-500 mb-6">You haven't registered for any events yet.</p>
          <Link 
            href="/" 
            className="inline-block bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-3 rounded-xl transition"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {registrations.map((reg) => {
            const isCheckedIn = reg.status === 'checked_in';

            return (
              <div 
                key={reg.id} 
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      isCheckedIn 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}>
                      {isCheckedIn ? 'Checked In ✓' : 'Active Ticket'}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">ID: {reg.id.slice(0, 8)}...</span>
                  </div>

                  <h3 className="text-2xl font-bold mb-2">{reg.event.title}</h3>
                  <p className="text-sm text-neutral-400 mb-1">📅 {new Date(reg.event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-sm text-neutral-400 mb-6">📍 {reg.event.location}</p>
                </div>

                {!isCheckedIn && (
                  <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center my-4">
                    <QRCodeWrapper value={reg.id} />
                    <p className="text-xs text-neutral-600 mt-2 font-medium">Show this code at the venue entrance</p>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-800 flex justify-between items-center mt-4">
                  <Link 
                    href={`/events/${reg.event.id}`} 
                    className="text-sm text-green-400 hover:underline font-semibold"
                  >
                    View Event Details →
                  </Link>

                  {!isCheckedIn && (
                    <CancelTicketButton registrationId={reg.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}