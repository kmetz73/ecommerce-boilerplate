import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { getCatalogForViewer } from '@/features/products/services/products';
import { getRatingSummariesForProducts } from '@/features/reviews/services/rating-summaries';
import DeleteProductForm from '@/features/products/components/DeleteProductForm';
import ProductCard from '@/features/products/components/ProductCard';

type ProductsPageProps = {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    availability?: string;
  }>;
};

const ProductsPage = async ({ searchParams }: ProductsPageProps) => {
  const params = await searchParams;

  const search = typeof params.search === 'string' ? params.search.trim() : '';

  const sort =
    params.sort === 'price-asc' ||
    params.sort === 'price-desc' ||
    params.sort === 'name'
      ? params.sort
      : 'newest';

  const availability =
    params.availability === 'available' || params.availability === 'sold-out'
      ? params.availability
      : undefined;

  const { products, canManage } = await getCatalogForViewer({
    search: search || undefined,
    sort,
    availability,
  });

  const ratingsByProduct = await getRatingSummariesForProducts(
    products.map((product) => product.uuid)
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6">
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <div key={product.uuid} className="flex flex-col gap-3">
              <ProductCard
                rating={ratingsByProduct.get(product.uuid) ?? null}
                product={{
                  slug: product.slug,
                  name: product.name,
                  priceCents: product.priceCents,
                  salePriceCents: product.salePriceCents,
                  active: product.active,
                  image: product.images[0] ?? null,
                  variants: product.variants,
                }}
              />

              {canManage && (
                <div className="flex flex-wrap items-center gap-3">
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
          ))}
        </div>
      )}
    </main>
  );
};

export default ProductsPage;
