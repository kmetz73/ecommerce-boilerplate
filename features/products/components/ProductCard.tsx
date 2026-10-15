import Image from 'next/image';
import Link from 'next/link';

import ProductPrice from '@/features/products/components/ProductPrice';

import { getCatalogPricing } from '@/features/products/lib/catalog-pricing';

import StarRatingDisplay from '@/features/reviews/components/StarRatingDisplay';

import type { ProductRatingSummary } from '@/features/reviews/data/rating-summaries';
import AddToCartButton from '@/features/cart/components/AddToCartButton';

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
    uuid: string;
    slug: string;
    name: string;
    priceCents: number;
    salePriceCents?: number | null;
    active: boolean;
    image?: ProductCardImage | null;
    variants?: ProductCardVariant[];
    stockQuantity?: number | null;
  };

  rating?: ProductRatingSummary | null;
};

const ProductCard = ({ product, rating }: ProductCardProps) => {
  const productUrl = `/products/${product.slug}`;
  const hasVariants = (product.variants?.length ?? 0) > 0;

  // Use our existing product pricing rules.
  const pricing = getCatalogPricing(
    {
      priceCents: product.priceCents,
      salePriceCents: product.salePriceCents ?? null,
      active: product.active,
      stockQuantity: product.stockQuantity,
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

        {/* Product availability and cart actions */}
        <div className="mt-auto space-y-3 pt-3">
          <p className="text-sm text-muted-foreground">
            {pricing.isAvailable ? 'Available' : 'Sold out'}
          </p>

          {!pricing.isAvailable ? (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-md border bg-muted px-3 py-3 text-sm font-semibold text-muted-foreground"
            >
              Sold Out
            </button>
          ) : hasVariants ? (
            <Link
              href={productUrl}
              className="flex w-full items-center justify-center rounded-md border px-3 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Choose Options
            </Link>
          ) : (
            <AddToCartButton productUuid={product.uuid} />
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
  