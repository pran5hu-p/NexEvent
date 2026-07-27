'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewForm({ eventId }: { eventId: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, rating, comment }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to submit review');

      setSuccess(true);
      router.refresh(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-2xl text-center mt-8">
        <h3 className="text-green-400 font-bold text-lg mb-1">Thank you!</h3>
        <p className="text-sm text-neutral-300">Your review has been successfully submitted.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mt-8">
      <h3 className="text-xl font-bold text-white mb-4">Leave a Review</h3>
      
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`text-3xl transition-colors ${
                star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-neutral-700'
              }`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              ★
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you think of the event? (Optional)"
          className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-green-500 min-h-[100px] resize-none"
        ></textarea>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 text-black text-sm font-bold px-6 py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}