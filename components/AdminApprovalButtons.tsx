'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminApprovalButtons({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUpdate(newStatus: 'approved' | 'rejected') {
    setLoading(true);
    const toastId = toast.loading(`Marking as ${newStatus}...`);

    try {
      const res = await fetch(`/api/events/${eventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Event ${newStatus}!`, { id: toastId });
      
      // Refresh the page data so the event disappears from the pending list
      router.refresh(); 
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3 mt-4 pt-4 border-t border-neutral-800">
      <button
        onClick={() => handleUpdate('approved')}
        disabled={loading}
        className="flex-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold py-2 rounded-lg transition disabled:opacity-50"
      >
        Approve
      </button>
      <button
        onClick={() => handleUpdate('rejected')}
        disabled={loading}
        className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold py-2 rounded-lg transition disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}