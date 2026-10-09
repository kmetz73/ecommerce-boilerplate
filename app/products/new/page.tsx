import CreateProductForm from '@/features/products/components/CreateProductForm';
import { requireAdminPage } from '@/lib/auth/require-admin-page';

const NewProductPage = async () => {
  await requireAdminPage();
  return (
    <main className="mx-auto max-w-xl space-y-6 p-6">
      <div>
        <CreateProductForm />
        <h1 className="text-3xl font-bold">Create Product</h1>
        <p className="text-muted-foreground">
          Add a new product to the shared catalog.
        </p>
      </div>
    </main>
  );
};

export default NewProductPage;
