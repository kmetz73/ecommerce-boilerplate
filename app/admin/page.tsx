import { toggleAdminProductActive } from '@/features/admin/actions/admin-products';
import { requireAdminPage } from '@/lib/auth/require-admin-page';
import { getAllProductsForAdmin } from '@/features/admin/services/admin-products';

const AdminPage = async () => {
  const admin = await requireAdminPage();
  const products = await getAllProductsForAdmin();

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <p className="text-muted-foreground">Signed in as {admin.name}.</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>

          <p className="text-muted-foreground">
            Manage product availability across the application.
          </p>
        </div>

        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.uuid}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{product.name}</p>

                  <p className="text-sm text-muted-foreground">
                    Status: {product.active ? 'Available' : 'Sold out'}
                  </p>
                </div>

                <form action={toggleAdminProductActive}>
                  <input
                    type="hidden"
                    name="productUuid"
                    value={product.uuid}
                  />

                  <input
                    type="hidden"
                    name="active"
                    value={product.active ? 'false' : 'true'}
                  />

                  <button
                    type="submit"
                    className="rounded-md border px-3 py-2 text-sm"
                  >
                    {product.active ? 'Mark sold out' : 'Mark available'}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminPage;
