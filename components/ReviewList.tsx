import React from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    avatarUrl: string | null;
  };
}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center mt-8">
        <p className="text-neutral-400">No reviews yet. Be the first to share your experience!</p>
      </div>
    );
  }

  // Calculate average rating
  const avgRating = (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="mt-10">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-2xl font-bold text-white">Attendee Reviews</h3>
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full">
          <span className="text-yellow-400">★</span>
          <span className="text-white font-bold">{avgRating}</span>
          <span className="text-neutral-500 text-sm">({reviews.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              {/* Star Rating display */}
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-neutral-700'}>
                    ★
                  </span>
                ))}
              </div>
              
              {/* Review Comment */}
              {review.comment && (
                <p className="text-neutral-300 text-sm mb-6 leading-relaxed">
                  "{review.comment}"
                </p>
              )}
            </div>

            {/* Reviewer Info */}
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {review.user.avatarUrl ? (
                  <img src={review.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  review.user.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{review.user.name || 'Anonymous Attendee'}</p>
                <p className="text-xs text-neutral-500">
                  {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}