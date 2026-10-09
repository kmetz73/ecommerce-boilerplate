import { createProduct } from '@/features/products/actions/products';
import SubmitButton from '@/components/SubmitButton';

const CreateProductForm = () => {
  return (
    <form action={createProduct} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Product name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={4}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="priceCents" className="text-sm font-medium">
          Price in cents
        </label>

        <input
          id="priceCents"
          name="priceCents"
          type="number"
          min="0"
          required
          className="w-full rounded-md border px-3 py-2"
        />

        <p className="text-muted-foreground text-sm">
          Example: enter 1999 for $19.99.
        </p>
      </div>
      {/* Optional primary product image */}
      <div className="space-y-2">
        <label htmlFor="product-image" className="block text-sm font-medium">
          Primary Product Image (Optional)
        </label>

        <input
          id="product-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full rounded-md border px-3 py-2 text-sm"
        />

        <p className="text-sm text-muted-foreground">
          JPG, PNG, or WebP. Maximum 5 MB. You can add more photos after
          creating the product.
        </p>
      </div>

      <SubmitButton pendingText="adding...">Create Product</SubmitButton>
    </form>
  );
};

export default CreateProductForm;
