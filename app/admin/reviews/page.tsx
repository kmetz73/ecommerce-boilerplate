import Link from 'next/link';

import { getAdminReviews } from '@/features/reviews/services/moderation';

import ReviewModerationForm from '@/features/reviews/components/ReviewModerationForm';

import StarRatingDisplay from '@/features/reviews/components/StarRatingDisplay';

const AdminReviewsPage = async () => {
  // The service checks requireAdmin().
  const reviews = await getAdminReviews();

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to Admin
        </Link>

        <h1 className="text-3xl font-bold">Review Moderation</h1>

        <p className="text-muted-foreground">
          Manage customer review visibility. Hidden reviews are excluded from
          public ratings.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {reviews.length} most recent reviews (up to 100).
      </p>

      {reviews.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <h2 className="font-semibold">No reviews found</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Customer reviews will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.uuid}
              className="space-y-4 rounded-xl border p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {review.product.name}
                  </Link>

                  <p className="text-sm text-muted-foreground">
                    Reviewed by {review.user.name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {review.createdAt.toLocaleDateString('en-US')}
                  </p>
                </div>

                <span
                  className={
                    review.status === 'PUBLISHED'
                      ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300'
                      : 'rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'
                  }
                >
                  {review.status === 'PUBLISHED' ? 'Published' : 'Hidden'}
                </span>
              </div>

              <StarRatingDisplay rating={Number(review.rating)} />

              {review.body && (
                <p className="whitespace-pre-wrap text-sm">{review.body}</p>
              )}

              <div className="border-t pt-4">
                <ReviewModerationForm
                  reviewUuid={review.uuid}
                  status={review.status}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default AdminReviewsPage;
