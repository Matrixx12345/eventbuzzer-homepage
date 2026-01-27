interface EventRatingProps {
  buzzScore?: number | null;
}

/**
 * Display-only star rating based on buzz_score
 * Converts buzz_score (0-100) to star rating (0-5)
 * Matches the EventList1 rating display logic
 */
export function EventRating({ buzzScore }: EventRatingProps) {
  const score = buzzScore || 75; // Default to 75 if no score

  // Calculate rating (0-5) - same as EventList1
  const rating = score / 20; // 100 = 5.0, 75 = 3.75, 50 = 2.5
  const goldStars = Math.floor(rating); // Floor for gold stars display
  const grayStars = 5 - goldStars;

  return (
    <div className="flex items-center gap-2">
      {/* Gold Stars */}
      {Array.from({ length: goldStars }).map((_, i) => (
        <span key={`gold-${i}`} className="text-yellow-400 text-lg">⭐</span>
      ))}

      {/* Gray Stars */}
      {Array.from({ length: grayStars }).map((_, i) => (
        <span key={`gray-${i}`} className="text-gray-300 text-lg">⭐</span>
      ))}

      {/* Rating text */}
      <span className="text-sm font-semibold text-gray-600 ml-1">
        {rating.toFixed(1)} von 5
      </span>
    </div>
  );
}
