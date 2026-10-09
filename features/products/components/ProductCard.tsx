import Image from 'next/image';
import Link from 'next/link';

type ProductCardImage = {
  id: string;
  altText: string;
};

type ProductCardProps = {
  product: {
    slug: string;
    name: string;
    priceCents: number;
    active: boolean;
    image?: ProductCardImage | null;
  };
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const ProductCard = ({ product }: ProductCardProps) => {
  const productUrl = `/products/${product.slug}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      {/* Product image */}
      <Link href={productUrl} className="block overflow-hidden bg-white">
        {product.image ? (
          <Image
            src={`/api/product-images/${product.image.id}`}
            alt={product.image.altText}
            width={480}
            height={480}
            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
            className="aspect-square w-full object-contain p-3 transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-muted p-4 text-center text-sm text-muted-foreground">
            No image available
          </div>
        )}
      </Link>

      {/* Product information */}
      <div className="flex flex-1 flex-col gap-2 p-2 sm:p-4">
        <Link
          href={productUrl}
          className="line-clamp-2 text-sm font-semibold hover:underline sm:text-base"
        >
          {product.name}
        </Link>

        <p className="text-base font-bold sm:text-lg">
          {currencyFormatter.format(product.priceCents / 100)}
        </p>

        <p className="mt-auto text-sm text-muted-foreground">
          {product.active ? 'Available' : 'Sold out'}
        </p>
      </div>
    </article>
  );
};

export default ProductCard;
