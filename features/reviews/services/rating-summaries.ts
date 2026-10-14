import { getPublishedRatingSummaries } from '@/features/reviews/data/rating-summaries';

export async function getRatingSummariesForProducts(productUuids: string[]) {
  return getPublishedRatingSummaries(productUuids);
}
