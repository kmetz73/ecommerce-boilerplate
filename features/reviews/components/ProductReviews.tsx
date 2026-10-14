import Link from 'next/link';

import {
  getReviewsForProduct,
  getMyReviewForProduct,
} from '@/features/reviews/services/reviews';

import ReviewForm from './ReviewForm';
import ReviewManagement from './ReviewManagement';
import StarRatingDisplay from './StarRatingDisplay';

type ProductReviewsProps = {
  productUuid: string;
};

type PublishedReview = {
  uuid: string;
  rating: number | { toNumber(): number };
  body: string | null;
  createdAt: Date;
  user: {
    name: string;
  };
};

const ProductReviews = async ({ productUuid }: ProductReviewsProps) => {
  const [reviewsResult, viewer] = await Promise.all([
    getReviewsForProduct(productUuid),
    getMyReviewForProduct(productUuid),
  ]);

  const reviews: PublishedReview[] = reviewsResult;

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + Number(review.rating), 0) /
        reviews.length
      : null;

  return (
    <section className="space-y-6 border-t pt-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>

        {averageRating !== null && (
          <div className="flex flex-wrap items-center gap-3">
            <StarRatingDisplay rating={averageRating} />
            <span className="text-sm text-muted-foreground">
              Average rating
            </span>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {reviews.length === 1
            ? '1 customer review'
            : `${reviews.length} customer reviews`}
        </p>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published reviews yet.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.uuid}
              className="space-y-3 rounded-xl border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{review.user.name}</p>

                <time
                  dateTime={review.createdAt.toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {review.createdAt.toLocaleDateString('en-US')}
                </time>
              </div>

              <StarRatingDisplay rating={Number(review.rating)} />

              {review.body && (
                <p className="whitespace-pre-wrap text-sm">{review.body}</p>
              )}
            </article>
          ))}
        </div>
      )}

      {viewer.signedIn ? (
        viewer.review ? (
          <ReviewManagement
            productUuid={productUuid}
            review={{
              uuid: viewer.review.uuid,
              rating: Number(viewer.review.rating),
              body: viewer.review.body,
              status: viewer.review.status,
            }}
          />
        ) : (
          <ReviewForm productUuid={productUuid} />
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-medium underline">
            Sign in
          </Link>{' '}
          to write a review.
        </p>
      )}
    </section>
  );
};

export default ProductReviews;
