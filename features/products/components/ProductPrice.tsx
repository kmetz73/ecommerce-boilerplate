type ProductPriceProps = {
  priceCents: number;
  salePriceCents: number | null;
  size?: 'card' | 'detail';
};

const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

const ProductPrice = ({
  priceCents,
  salePriceCents,
  size = 'card',
}: ProductPriceProps) => {
  const isOnSale =
    salePriceCents !== null &&
    salePriceCents >= 0 &&
    salePriceCents < priceCents;

  const displayPrice = isOnSale ? salePriceCents : priceCents;

  const savings = isOnSale ? priceCents - salePriceCents : 0;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-2">
        {isOnSale && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(priceCents)}
          </span>
        )}

        <span
          className={
            size === 'detail'
              ? 'text-3xl font-bold tabular-nums'
              : 'text-lg font-bold tabular-nums'
          }
        >
          {formatPrice(displayPrice)}
        </span>

        {isOnSale && (
          <span className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
            Sale
          </span>
        )}
      </div>

      {isOnSale && (
        <p className="text-xs font-medium text-green-700 dark:text-green-400">
          Save {formatPrice(savings)}
        </p>
      )}
    </div>
  );
};

export default ProductPrice;
