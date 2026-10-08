import { createProduct } from '@/features/products/actions/products';
import SubmitButton from '@/components/SubmitButton';
import { requireAdminPage } from '@/lib/auth/require-admin-page';

const NewProductPage = async () => {
  await requireAdminPage();
  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Create Product</h1>
        <p className="text-muted-foreground">
          Add a new product to the shared catalog.
        </p>
      </div>

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

        <SubmitButton pendingText="adding...">Create Product</SubmitButton>
      </form>
    </main>
  );
};

export default NewProductPage;
