import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

import { getCatalogForViewer } from '@/features/products/services/products';
import DeleteProductForm from '@/features/products/components/DeleteProductForm';

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    availability?: string;
  }>;
};

const ProductsPage = async ({ searchParams }: ProductsPageProps) => {
  const params = await searchParams;

  const search =
    typeof params.search === 'string' ? params.search.trim() : '';

  const sort =
    params.sort === 'price-asc' ||
    params.sort === 'price-desc' ||
    params.sort === 'name'
      ? params.sort
      : 'newest';

  const availability =
    params.availability === 'available' ||
    params.availability === 'sold-out'
      ? params.availability
      : undefined;

  const { products, canManage } = await getCatalogForViewer({
    search: search || undefined,
    sort,
    availability,
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>

          <p className="text-muted-foreground">
            Browse the current product catalog.
          </p>
        </div>

        {canManage && (
          <Link
            href="/products/new"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Add product
          </Link>
        )}
      </div>
      <form
        action="/products"
        method="get"
        className="grid gap-4 rounded-lg border p-4 md:grid-cols-4"
      >
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search products
          </label>

          <input
            id="search"
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Search by name or description"
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="availability" className="text-sm font-medium">
            Availability
          </label>

          <select
            id="availability"
            name="availability"
            defaultValue={availability ?? ''}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="">All products</option>
            <option value="available">Available</option>
            <option value="sold-out">Sold out</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="sort" className="text-sm font-medium">
            Sort
          </label>

          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="w-full rounded-md border px-3 py-2"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="flex gap-2 md:col-span-4">
          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Apply filters
          </button>

          <Link
            href="/products"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Clear
          </Link>
        </div>
      </form>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length === 1 ? '1 product' : `${products.length} products`}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <h2 className="text-lg font-semibold">No products found</h2>

          <p className="mt-2 text-muted-foreground">
            Try changing your search or filters.
          </p>

          <Link
            href="/products"
            className="mt-4 inline-block rounded-md border px-4 py-2 text-sm font-medium"
          >
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <article
              key={product.uuid}
              className="group relative rounded-lg border p-6 transition-colors hover:bg-muted/50"
            >
              {product.slug && (
                <Link
                  href={`/products/${product.slug}`}
                  aria-label={`View ${product.name}`}
                  className="absolute inset-0 z-0 rounded-lg"
                />
              )}

              <div className="pointer-events-none relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">{product.name}</h2>

                  <p className="font-medium">
                    ${(product.priceCents / 100).toFixed(2)}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {product.active ? 'Available' : 'Sold out'}
                  </p>
                </div>

                {canManage && (
                  <div className="pointer-events-auto relative z-20 flex items-center gap-3">
                    {product.slug && (
                      <Link
                        href={`/products/${product.slug}/edit`}
                        className={buttonVariants()}
                      >
                        Edit
                      </Link>
                    )}

                    <DeleteProductForm productUuid={product.uuid} />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default ProductsPage;
