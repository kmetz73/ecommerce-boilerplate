import Link from 'next/link';

import { getNewestProducts } from '@/features/products/services/products';

const ShopPage = async () => {
  const newestProducts = await getNewestProducts();

  return (
    <main className="mx-auto max-w-6xl space-y-10 p-6">
      <section className="space-y-6 rounded-xl border p-8">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Storefront
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
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
            className="flex-1 rounded-md border px-4 py-3"
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {newestProducts.map((product) => (
              <Link
                key={product.uuid}
                href={`/products/${product.slug}`}
                className="space-y-3 rounded-lg border p-5 transition hover:bg-muted/50"
              >
                <div>
                  <h3 className="font-semibold">{product.name}</h3>

                  <p className="text-sm text-muted-foreground">
                    {product.active ? 'Available' : 'Sold out'}
                  </p>
                </div>

                <p className="text-lg font-semibold">
                  ${(product.priceCents / 100).toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ShopPage;
