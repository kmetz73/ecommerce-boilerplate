import Image from 'next/image';
import Link from 'next/link';

import ProductPrice from '@/features/products/components/ProductPrice';

import { getCatalogPricing } from '@/features/products/lib/catalog-pricing';

import StarRatingDisplay from '@/features/reviews/components/StarRatingDisplay';

import type { ProductRatingSummary } from '@/features/reviews/data/rating-summaries';

type ProductCardImage = {
  id: string;
  altText: string;
};

type ProductCardVariant = {
  optionValues: unknown;
  priceCents: number | null;
  salePriceCents: number | null;
  stockQuantity: number;
  active: boolean;
};

type ProductCardProps = {
  product: {
    slug: string;
    name: string;
    priceCents: number;
    salePriceCents?: number | null;
    active: boolean;
    image?: ProductCardImage | null;
    variants?: ProductCardVariant[];
  };

  rating?: ProductRatingSummary | null;
};

const ProductCard = ({ product, rating }: ProductCardProps) => {
  const productUrl = `/products/${product.slug}`;

  // Use our existing product pricing rules.
  const pricing = getCatalogPricing(
    {
      priceCents: product.priceCents,
      salePriceCents: product.salePriceCents ?? null,
      active: product.active,
    },
    product.variants ?? []
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      {/* Product image */}
      <Link href={productUrl} className="block overflow-hidden bg-white">
        {product.image ? (
          <Image
            src={`/api/product-images/${product.image.id}`}
            alt={product.image.altText}
            width={480}
            height={480}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
            className="aspect-square w-full object-contain p-3 transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-muted p-4 text-center text-sm text-muted-foreground">
            No image available
          </div>
        )}
      </Link>

      {/* Product information */}
      <div className="flex flex-1 flex-col gap-2 p-2 sm:p-4">
        <Link
          href={productUrl}
          className="line-clamp-2 text-sm font-semibold hover:underline sm:text-base"
        >
          {product.name}
        </Link>

        {/* Product pricing */}
        <div className="space-y-1">
          <ProductPrice
            priceCents={pricing.priceCents}
            salePriceCents={pricing.salePriceCents}
            size="card"
          />
        </div>

        {/* Average published customer rating */}
        {rating && rating.reviewCount > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <StarRatingDisplay rating={rating.averageRating} />

            <span className="text-xs text-muted-foreground">
              ({rating.reviewCount})
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No reviews yet</p>
        )}

        {/* Availability */}
        <p className="mt-auto text-sm text-muted-foreground">
          {pricing.isAvailable ? 'Available' : 'Sold out'}
        </p>
      </div>
    </article>
  );
};

export default ProductCard;
  