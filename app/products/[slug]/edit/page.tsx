import { notFound } from 'next/navigation';

import UploadProductImageForm from '@/features/products/components/UploadProductImageForm';
import EditProductForm from '@/features/products/components/EditProductForm';
import ProductImageManager from '@/features/products/components/ProductImageManager';

import { getPublicCatalogProductBySlug } from '@/features/products/services/products';
import { getProductImages } from '@/features/products/data/product-images';
import { requireAdminPage } from '@/lib/auth/require-admin-page';

type EditProductPageProps = {
  params: Promise<{
    slug: string;
  }>;

  // NEW: Read the optional image upload failure parameter.
  searchParams: Promise<{
    imageUpload?: string;
  }>;
};

const EditProductPage = async ({
  params,
  searchParams,
}: EditProductPageProps) => {
  await requireAdminPage();

  const { slug } = await params;

  // NEW: Determine whether the initial upload failed.
  const { imageUpload } = await searchParams;
  const imageUploadFailed = imageUpload === 'failed';

  const product = await getPublicCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const images = await getProductImages(product.uuid);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>

        <p className="text-muted-foreground">
          Update product information, photos, and display settings.
        </p>
      </div>

      {/* Image upload failure warning */}
      {imageUploadFailed && (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4"
        >
          <h2 className="font-semibold text-amber-700 dark:text-amber-400">
            Product created, but image upload failed
          </h2>

          <p className="mt-2 text-sm">
            Your product was saved successfully, but its initial image could not
            be uploaded. Use the Product Images section to try again.
          </p>
        </div>
      )}

      {/* Responsive two-column layout */}
      <div className="grid items-start gap-6 lg:grid-cols-2 xl:gap-8">
        {/* Left: Product details */}
        <section className="min-w-0 space-y-6 rounded-xl border bg-card p-5 sm:p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Product Details</h2>

            <p className="text-sm text-muted-foreground">
              Manage the product name, description, and price.
            </p>
          </div>

          <EditProductForm product={product} />
        </section>

        {/* Right: Image management */}
        <div className="min-w-0 space-y-6">
          <UploadProductImageForm productUuid={product.uuid} />

          <ProductImageManager productUuid={product.uuid} images={images} />
        </div>
      </div>
    </main>
  );
};

export default EditProductPage;
