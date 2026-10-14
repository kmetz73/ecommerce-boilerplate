import { Star } from 'lucide-react';

type StarRatingDisplayProps = {
  rating: number;
  showValue?: boolean;
};

const StarRatingDisplay = ({
  rating,
  showValue = true,
}: StarRatingDisplayProps) => {
  const safeRating = Math.max(0, Math.min(5, rating));

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={`${safeRating.toFixed(2)} out of 5 stars`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.max(0, Math.min(1, safeRating - index));

          return (
            <span key={index} className="relative block size-5">
              <Star
                className="absolute inset-0 size-5 text-amber-400"
                strokeWidth={1.5}
              />

              <span
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className="size-5 fill-amber-400 text-amber-400"
                  strokeWidth={1.5}
                />
              </span>
            </span>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-medium" aria-hidden="true">
          {safeRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRatingDisplay;
