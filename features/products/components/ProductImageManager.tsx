import Image from 'next/image';

import { setPrimaryProductImageAction } from '@/features/products/actions/product-images';
import DeleteProductImageForm from '@/features/products/components/DeleteProductImageForm';

type ProductImage = {
  id: string;
  altText: string;
  sortOrder: number;
};

type ProductImageManagerProps = {
  productUuid: string;
  images: ProductImage[];
};

const ProductImageManager = ({
  productUuid,
  images,
}: ProductImageManagerProps) => {
  return (
    <section className="space-y-4 rounded-lg border p-6">
      <div>
        <h2 className="text-xl font-semibold">Manage Product Images</h2>

        <p className="text-sm text-muted-foreground">
          View uploaded images and manage their display order.
        </p>
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
      ) : (
        <div className="grid gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="flex items-center gap-4 rounded-lg border p-3"
            >
              <div className="shrink-0 overflow-hidden rounded-md border bg-white">
                <Image
                  src={`/api/product-images/${image.id}`}
                  alt={image.altText}
                  width={96}
                  height={96}
                  unoptimized
                  className="h-24 w-24 object-contain"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="wrap-break-word text-sm font-medium">
                  {image.altText}
                </p>

                <p className="text-xs text-muted-foreground">
                  Position: {image.sortOrder}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {index === 0 ? (
                    <span className="inline-block rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      Primary Image
                    </span>
                  ) : (
                    <form action={setPrimaryProductImageAction}>
                      <input
                        type="hidden"
                        name="productUuid"
                        value={productUuid}
                      />

                      <input type="hidden" name="imageId" value={image.id} />

                      <button
                        type="submit"
                        className="rounded-md border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
                      >
                        Set as Primary
                      </button>
                    </form>
                  )}
                  <DeleteProductImageForm
                    productUuid={productUuid}
                    imageId={image.id}
                    imageAlt={image.altText}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductImageManager;
