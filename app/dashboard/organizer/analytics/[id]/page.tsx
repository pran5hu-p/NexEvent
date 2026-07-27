import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

export default async function EventAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const { id: eventId } = await params;

  // Fetch event details and all related registrations
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Security: Ensure only the event owner or admin can view analytics
  if (event.organizerId !== session.user.id && session.user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto mt-20 p-8 bg-neutral-900 border border-neutral-800 rounded-2xl text-center text-white">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
        <p className="text-neutral-400 mb-6">You do not have permission to view analytics for this event.</p>
        <Link href="/dashboard/organizer" className="bg-neutral-800 hover:bg-neutral-700 px-5 py-2.5 rounded-xl font-semibold transition">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Calculate Metrics
  const totalCapacity = event.capacity;
  const totalRegistered = event.registrations.length;
  const checkedInCount = event.registrations.filter((r) => r.status === 'checked_in').length;
  const pendingCount = totalRegistered - checkedInCount;
  const occupancyRate = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0;
  const checkInRate = totalRegistered > 0 ? Math.round((checkedInCount / totalRegistered) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 text-white">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href={`/events/${event.id}`} className="text-neutral-400 hover:text-white text-sm transition inline-block mb-2">
            ← Back to Event Page
          </Link>
          <h1 className="text-3xl font-bold">Analytics: {event.title}</h1>
        </div>
        <Link 
          href={`/dashboard/organizer/scanner/${event.id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl transition text-sm flex items-center gap-2"
        >
          📷 Open Live Scanner
        </Link>
      </div>

      {/* Summary Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <p className="text-sm text-neutral-400 mb-1">Total Capacity Filled</p>
          <h3 className="text-3xl font-extrabold text-white">{totalRegistered} <span className="text-lg text-neutral-500 font-normal">/ {totalCapacity}</span></h3>
          <div className="w-full bg-neutral-800 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(occupancyRate, 100)}%` }}></div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">{occupancyRate}% Occupancy Rate</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <p className="text-sm text-neutral-400 mb-1">Checked-In Attendees</p>
          <h3 className="text-3xl font-extrabold text-blue-400">{checkedInCount}</h3>
          <p className="text-xs text-neutral-500 mt-4 font-medium">Successfully scanned at door</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <p className="text-sm text-neutral-400 mb-1">Pending Check-Ins</p>
          <h3 className="text-3xl font-extrabold text-yellow-400">{pendingCount}</h3>
          <p className="text-xs text-neutral-500 mt-4 font-medium">Registered but not arrived</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <p className="text-sm text-neutral-400 mb-1">Attendance Conversion</p>
          <h3 className="text-3xl font-extrabold text-green-400">{checkInRate}%</h3>
          <div className="w-full bg-neutral-800 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${checkInRate}%` }}></div>
          </div>
          <p className="text-xs text-neutral-500 mt-2">Checked-in vs total registered</p>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Attendee List & Status</h3>

        {event.registrations.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No attendees have registered for this event yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Attendee Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-sm">
                {event.registrations.map((reg) => {
                  const isCheckedIn = reg.status === 'checked_in';
                  return (
                    <tr key={reg.id} className="hover:bg-neutral-800/50 transition">
                      <td className="py-4 px-4 font-medium text-white">{reg.user.name}</td>
                      <td className="py-4 px-4 text-neutral-400">{reg.user.email}</td>
                      <td className="py-4 px-4 text-neutral-400">{new Date(reg.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${
                          isCheckedIn 
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                            : 'bg-green-500/20 text-green-400 border-green-500/30'
                        }`}>
                          {isCheckedIn ? 'Checked In ✓' : 'Registered'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}