'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegistrationButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    const toastId = toast.loading('Securing your ticket...');

    try {
      const res = await fetch('/api/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to register');
      }

      toast.success('Ticket secured successfully!', { id: toastId });
      
      // Refresh the page so the server re-evaluates the "isRegistered" state
      router.refresh(); 
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRegister}
      disabled={loading}
      className="w-full bg-green-500 hover:bg-green-600 text-black font-bold text-lg py-4 rounded-xl transition duration-200 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Register Now'}
    </button>
  );
}