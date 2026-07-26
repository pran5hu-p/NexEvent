'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to cancel and delete this event? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Deleting event...');

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete event');
      }

      toast.success('Event cancelled successfully', { id: toastId });
      router.push('/dashboard/organizer');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="w-full mt-3 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 font-semibold py-3 rounded-xl transition duration-200 disabled:opacity-50 text-sm"
    >
      {loading ? 'Deleting...' : 'Cancel / Delete Event'}
    </button>
  );
}