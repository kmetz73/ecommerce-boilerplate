import { notFound } from 'next/navigation';
import { getCatalogPricing } from '@/features/products/lib/catalog-pricing';

import { getPublicCatalogProductBySlug } from '@/features/products/services/products';
import { getProductImages } from '@/features/products/data/product-images';
import { getProductVariants } from '@/features/products/data/product-variants';
import { productVariantSchema } from '@/features/products/validation/product-variants';

import ProductGallery from '@/features/products/components/ProductGallery';
import ProductVariantSelector from '@/features/products/components/ProductVariantSelector';
import ProductPrice from '@/features/products/components/ProductPrice';
import ProductReviews from '@/features/reviews/components/ProductReviews';
import AddToCartButton from '@/features/cart/components/AddToCartButton';


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

  const [images, allVariants] = await Promise.all([
    getProductImages(product.uuid),
    getProductVariants(product.uuid),
  ]);

  // Only expose active variants with valid options.
  const variants = allVariants
    .filter((variant) => variant.active)
    .flatMap((variant) => {
      const parsed = productVariantSchema.shape.optionValues.safeParse(
        variant.optionValues
      );

      if (!parsed.success) {
        return [];
      }

      return [
        {
          uuid: variant.uuid,
          optionValues: parsed.data,
          priceCents: variant.priceCents,
          salePriceCents: variant.salePriceCents,
          stockQuantity: variant.stockQuantity,
        },
      ];
    });

  const hasVariants = allVariants.length > 0;

  const { isAvailable } = getCatalogPricing(product, allVariants);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="grid items-start gap-8 md:grid-cols-2">
        <ProductGallery
          images={images.map((image) => ({
            id: image.id,
            altText: image.altText,
          }))}
        />
        <ProductReviews productUuid={product.uuid} />

        <div className="min-w-0 space-y-5">
          <p className="text-sm text-muted-foreground">
            {isAvailable ? 'Available' : 'Sold out'}
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">{product.name}</h1>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          {hasVariants ? (
            <ProductVariantSelector
              productUuid={product.uuid}
              variants={variants}
              basePriceCents={product.priceCents}
              baseSalePriceCents={product.salePriceCents}
              productActive={product.active}
            />
          ) : (
            <div className="space-y-4">
              <ProductPrice
                priceCents={product.priceCents}
                salePriceCents={product.salePriceCents}
                size="detail"
              />

              <AddToCartButton
                productUuid={product.uuid}
                disabled={!isAvailable}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ProductPage;
