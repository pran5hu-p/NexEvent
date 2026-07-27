'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CancelTicketButton({ registrationId }: { registrationId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your ticket for this event?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/registration/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to cancel ticket');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
    >
      {loading ? 'Cancelling...' : 'Cancel Ticket'}
    </button>
  );
}