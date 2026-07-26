import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import LiveCheckins from '@/components/LiveCheckins';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function LiveScannerPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. Authenticate the user
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user.role !== 'organizer' && session.user.role !== 'admin')) {
    redirect('/'); // Kick out unauthenticated or unauthorized users
  }

  // Await the params in Next.js 15+
  const { id } = await params;

  // 2. Verify the event exists, is approved, AND belongs to this specific organizer
  const event = await prisma.event.findUnique({
    where: { 
      id: id,
      // SECURITY: Ensure the logged-in user actually owns this event
      // (Unless they are an admin, who can view anything)
      ...(session.user.role !== 'admin' && { organizerId: session.user.id })
    },
    select: { title: true, status: true }
  });

  if (!event || event.status.trim().toLowerCase() !== 'approved') {
    return notFound(); // Show a 404 if event is fake, pending, or belongs to someone else
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard/organizer" 
          className="text-sm text-neutral-400 hover:text-white mb-4 inline-block transition"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">
          <span className="text-green-400">Live Scanner:</span> {event.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: The Camera / Scanner UI */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[500px]">
          <div className="w-72 h-72 border-4 border-dashed border-neutral-700 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden bg-black/50">
            {/* Fake scanning laser for visuals */}
            <div className="absolute top-0 w-full h-0.5 bg-green-500 shadow-[0_0_20px_#22c55e] opacity-50 animate-pulse"></div>
            
            <p className="text-neutral-500 font-mono text-sm text-center px-4">
              [ Camera Feed Interface ] <br/><br/>
              QR Scanner integration goes here.
            </p>
          </div>
          
          <h3 className="text-white font-bold mb-2">Ready to Scan</h3>
          <p className="text-neutral-400 text-center text-sm max-w-sm">
            Point a camera at an attendee's QR ticket. The system will automatically verify and check them in.
          </p>
        </div>

        {/* Right Side: The WebSocket Feed Component */}
        <div className="h-[500px]">
          {/* We pass the URL ID directly into the component we built earlier */}
          <LiveCheckins eventId={id} />
        </div>

      </div>
    </div>
  );
}