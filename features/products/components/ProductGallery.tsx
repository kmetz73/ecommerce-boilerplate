'use client';

import { useState } from 'react';
import Image from 'next/image';

type ProductGalleryImage = {
  id: string;
  altText: string;
};

type ProductGalleryProps = {
  images: ProductGalleryImage[];
};

const ProductGallery = ({ images }: ProductGalleryProps) => {
  const [selectedImageId, setSelectedImageId] = useState(images[0]?.id ?? '');

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted text-muted-foreground">
        No product image available
      </div>
    );
  }

  const selectedImage =
    images.find((image) => image.id === selectedImageId) ?? images[0];

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Main selected image */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <Image
          src={`/api/product-images/${selectedImage.id}`}
          alt={selectedImage.altText}
          width={900}
          height={900}
          className="aspect-square w-full object-contain"
          sizes="(max-width: 640px) 100vw, 448px"
        />
      </div>

      {/* Image thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, index) => {
            const isSelected = image.id === selectedImage.id;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                aria-label={`View image ${index + 1}: ${image.altText}`}
                aria-pressed={isSelected}
                className={[
                  'overflow-hidden rounded-md border-2 transition-colors',
                  isSelected
                    ? 'border-primary'
                    : 'border-transparent hover:border-muted-foreground',
                ].join(' ')}
              >
                <Image
                  src={`/api/product-images/${image.id}`}
                  alt={image.altText}
                  width={160}
                  height={160}
                  sizes="(max-width: 448px) 25vw, 104px"
                  className="aspect-square w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
