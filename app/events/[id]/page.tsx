import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import RegistrationButton from '@/components/RegistrationButton';
import AdminApprovalButtons from '@/components/AdminApprovalButtons';
import Link from 'next/link';
import DeleteEventButton from '@/components/DeleteEventButton';
import ReviewList from '@/components/ReviewList';
import ReviewForm from '@/components/ReviewForm';

export default async function EventDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // 1. Fetch the event details along with reviews
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { name: true } },
      reviews: {
        include: {
          user: {
            select: { name: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!event) return notFound();

  // Determine user roles
  const isAdmin = session?.user?.role === 'admin';
  const isOrganizer = session?.user?.id === event.organizerId;

  // ONLY hide the event if it's pending AND the user is a normal attendee
  if (event.status !== 'approved' && !isAdmin && !isOrganizer) {
    return notFound();
  }

  // 3. Check if the logged-in user is already registered
  let isRegistered = false;
  if (session?.user && !isAdmin && !isOrganizer) {
    const existingRegistration = await prisma.registration.findFirst({
      where: { eventId: id, userId: session.user.id }
    });
    if (existingRegistration) isRegistered = true;
  }

  // 4. Review Logic: Can the current user leave a review?
  const isEventCompleted = new Date(event.date) < new Date();
  let canReview = false;

  if (session?.user && isEventCompleted && !isAdmin && !isOrganizer) {
    // Check if they already reviewed it
    const hasReviewed = event.reviews.some((r) => r.userId === session?.user?.id);
    
    // If they haven't reviewed it (and ideally if they registered, though we keep it open for now)
    if (!hasReviewed) {
      canReview = true;
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">
      
      <Link href="/" className="text-neutral-400 hover:text-white mb-6 inline-block transition text-sm">
        ← Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Side: Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative h-96 w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800">
            {event.posterUrl ? (
              <Image 
                src={event.posterUrl} 
                alt={event.title} 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-600 text-xl font-bold">
                No Poster Available
              </div>
            )}
          </div>

          <div>
            <div className="inline-block bg-neutral-800 text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
              {event.category}
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-4">{event.title}</h1>
            <p className="text-lg text-neutral-400 whitespace-pre-wrap">{event.description}</p>
          </div>
        </div>

        {/* Right Side: Action Card */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sticky top-24">
            
            <h3 className="text-xl font-bold text-white mb-6 border-b border-neutral-800 pb-4">Event Info</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-neutral-300">
                <span className="w-8">📅</span>
                <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center text-neutral-300">
                <span className="w-8">⏰</span>
                <span>{new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center text-neutral-300">
                <span className="w-8">📍</span>
                <span>{event.location}</span>
              </div>
              <div className="flex items-center text-neutral-300">
                <span className="w-8">👥</span>
                <span>Capacity: {event.capacity}</span>
              </div>
            </div>

            {/* Dynamic Role-Based Action Panel */}
            {isAdmin ? (
              <div className="bg-neutral-800 rounded-xl p-4 text-center">
                <p className="text-yellow-400 font-bold mb-4">
                  {event.status === 'approved' ? 'Event is Currently Approved' : 'Admin Review Required'}
                </p>
                <AdminApprovalButtons eventId={event.id} currentStatus={event.status} />
                {event.status === 'approved' && (
                  <p className="text-xs text-neutral-400 mt-3">
                    You can switch the status back to pending or reject it using the buttons above.
                  </p>
                )}
              </div>
            ) : isOrganizer ? (
           <div className="bg-neutral-800 rounded-xl p-4 text-center space-y-3">
             {event.status === 'pending' ? (
               <p className="text-yellow-400 font-bold">⏳ Waiting for Admin Approval</p>
             ) : (
               <Link 
                 href={`/dashboard/organizer/scanner/${event.id}`} 
                 className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
               >
                 Open Live Scanner
               </Link>
             )}

             {/* Cancel / Delete Event Option */}
             <DeleteEventButton eventId={event.id} />
           </div>
            ) : !session?.user ? (
              <div className="bg-neutral-800 rounded-xl p-4 text-center">
                <p className="text-sm text-neutral-400 mb-2">You must be logged in to register.</p>
                <Link href="/api/auth/signin" className="text-green-400 font-bold hover:underline">
                  Sign In
                </Link>
              </div>
            ) : isRegistered ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <p className="text-green-400 font-bold mb-1">You're going!</p>
                <p className="text-xs text-neutral-400">View your ticket in the dashboard.</p>
              </div>
            ) : (
              <RegistrationButton eventId={event.id} />
            )}
            
          </div>
        </div>

      </div>

      {/* Reviews Section */}
      <div className="mt-16 border-t border-neutral-800 pt-8">
        
        {/* Render the form only if the event is over and they haven't reviewed it */}
        {canReview && (
          <div className="mb-10">
            <ReviewForm eventId={event.id} />
          </div>
        )}

        {/* Unconditionally render the list so everyone can see them */}
        <ReviewList reviews={event.reviews} />
      </div>

    </div>
  );
}