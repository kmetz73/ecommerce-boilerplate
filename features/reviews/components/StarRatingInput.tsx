'use client';

import { useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Star } from 'lucide-react';

type StarRatingInputProps = {
  name?: string;
  initialRating?: number;
};

const MIN_RATING = 0.25;
const MAX_RATING = 5;
const STEP = 0.25;

const StarRatingInput = ({ name = 'rating', initialRating = 0 }: StarRatingInputProps) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayedRating = hoverRating ?? rating;

  // Convert the mouse position into 0.25-star steps.
  const getRatingFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    const position = Math.max(
      0,
      Math.min(1, (event.clientX - rect.left) / rect.width)
    );

    return Math.max(
      MIN_RATING,
      Math.min(MAX_RATING, Math.ceil(position * 20) * STEP)
    );
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const nextRating = getRatingFromPointer(event);

    if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
      setHoverRating(nextRating);
    }

    if (event.pointerType === 'touch' && event.buttons > 0) {
      setRating(nextRating);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    setRating(getRatingFromPointer(event));
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let nextRating = rating;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        nextRating = Math.min(MAX_RATING, rating + STEP);
        break;

      case 'ArrowLeft':
      case 'ArrowDown':
        nextRating = Math.max(MIN_RATING, rating - STEP);
        break;

      case 'Home':
        nextRating = MIN_RATING;
        break;

      case 'End':
        nextRating = MAX_RATING;
        break;

      default:
        return;
    }

    event.preventDefault();
    setHoverRating(null);
    setRating(nextRating);
  };

  return (
    <div className="space-y-2">
      <input
        type="hidden"
        name={name}
        value={rating > 0 ? String(rating) : ''}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Your star rating"
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={rating}
          aria-valuetext={
            rating === 0 ? 'No rating selected' : `${rating} out of 5 stars`
          }
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setHoverRating(null)}
          onPointerLeave={() => setHoverRating(null)}
          onKeyDown={handleKeyDown}
          className="flex cursor-pointer touch-none select-none gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {Array.from({ length: 5 }, (_, index) => {
            const fill = Math.max(0, Math.min(1, displayedRating - index));

            return (
              <span
                key={index}
                aria-hidden="true"
                className="relative block size-10"
              >
                <Star
                  className="absolute inset-0 size-10 text-amber-400"
                  strokeWidth={1.5}
                />

                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className="size-10 fill-amber-400 text-amber-400"
                    strokeWidth={1.5}
                  />
                </span>
              </span>
            );
          })}
        </div>

        <span className="text-sm font-medium" aria-live="off">
          {displayedRating > 0
            ? `${displayedRating.toFixed(2)} / 5`
            : 'Choose a rating'}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Hover and click to rate. Use arrow keys for quarter-star adjustments.
      </p>
    </div>
  );
};

export default StarRatingInput;
