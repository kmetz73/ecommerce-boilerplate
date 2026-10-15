import Link from 'next/link';

import { getNewestProducts } from '@/features/products/services/products';

import ProductCard from '@/features/products/components/ProductCard';

import { getRatingSummariesForProducts } from '@/features/reviews/services/rating-summaries';

const ShopPage = async () => {
  // 1. Retrieve the newest products.
  const newestProducts = await getNewestProducts();

  // 2. Retrieve their average ratings and review counts.
  const ratingsByProduct = await getRatingSummariesForProducts(
    newestProducts.map((product) => product.uuid)
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-3 py-6 sm:px-6">
      <section className="space-y-6 rounded-xl border p-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Storefront
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Find your next product
          </h1>

          <p className="text-muted-foreground">
            Browse the catalog, search products, compare prices, and view
            availability.
          </p>
        </div>

        <form
          action="/products"
          method="get"
          className="flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <input
            type="search"
            name="search"
            placeholder="Search products"
            className="min-w-0 w-full flex-1 rounded-md border px-4 py-3"
          />

          <button
            type="submit"
            className="rounded-md border px-5 py-3 font-medium"
          >
            Search
          </button>
        </form>

        <div>
          <Link
            href="/products"
            className="inline-block rounded-md border px-5 py-3 font-medium"
          >
            Browse all products
          </Link>
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Newest Products</h2>

            <p className="text-sm text-muted-foreground">
              Recently added to the catalog.
            </p>
          </div>

          <Link
            href="/products"
            className="text-sm font-medium hover:underline"
          >
            View all products
          </Link>
        </div>

        {newestProducts.length === 0 ? (
          <p className="text-muted-foreground">
            No products are available yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {newestProducts.map((product) => (
              <ProductCard
                key={product.uuid}
                rating={ratingsByProduct.get(product.uuid) ?? null}
                product={{
                  uuid: product.uuid,
                  slug: product.slug,
                  name: product.name,
                  priceCents: product.priceCents,
                  salePriceCents: product.salePriceCents,
                  active: product.active,
                  image: product.images[0] ?? null,
                  variants: product.variants,
                  stockQuantity: product.stockQuantity,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ShopPage;
