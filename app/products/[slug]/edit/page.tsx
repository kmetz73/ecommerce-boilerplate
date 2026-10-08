import { notFound } from 'next/navigation';

import EditProductForm from '@/features/products/components/EditProductForm';
import { getPublicCatalogProductBySlug } from '@/features/products/services/products';
import { requireAdminPage } from '@/lib/auth/require-admin-page';

type EditProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const EditProductPage = async ({ params }: EditProductPageProps) => {
  await requireAdminPage();

  const { slug } = await params;

  const product = await getPublicCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>

        <p className="text-muted-foreground">
          Update this product in the shared catalog.
        </p>
      </div>

      <EditProductForm product={product} />
    </main>
  );
};

export default EditProductPage;
