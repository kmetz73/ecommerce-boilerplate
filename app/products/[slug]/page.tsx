import { notFound } from 'next/navigation';

import { getPublicCatalogProductBySlug } from '@/features/products/services/products';

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const ProductPage = async ({ params }: ProductPageProps) => {
  const { slug } = await params;

  const product = await getPublicCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {product.active ? 'Available' : 'Sold out'}
        </p>

        <h1 className="text-4xl font-bold">{product.name}</h1>

        <p className="text-2xl font-semibold">
          ${(product.priceCents / 100).toFixed(2)}
        </p>

        {product.description && (
          <p className="max-w-2xl text-muted-foreground">
            {product.description}
          </p>
        )}
      </div>
    </main>
  );
};

export default ProductPage;
