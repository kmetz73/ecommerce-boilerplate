-- AlterTable
ALTER TABLE "products" ADD COLUMN     "stock_quantity" INTEGER;

-- CreateTable
CREATE TABLE "carts" (
    "uuid" UUID NOT NULL,
    "user_id" INTEGER,
    "guest_token_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "uuid" UUID NOT NULL,
    "cart_uuid" UUID NOT NULL,
    "product_uuid" UUID NOT NULL,
    "variant_uuid" UUID,
    "selection_key" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_guest_token_hash_key" ON "carts"("guest_token_hash");

-- CreateIndex
CREATE INDEX "cart_items_product_uuid_idx" ON "cart_items"("product_uuid");

-- CreateIndex
CREATE INDEX "cart_items_variant_uuid_idx" ON "cart_items"("variant_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_uuid_selection_key_key" ON "cart_items"("cart_uuid", "selection_key");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_uuid_fkey" FOREIGN KEY ("cart_uuid") REFERENCES "carts"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_uuid_fkey" FOREIGN KEY ("variant_uuid") REFERENCES "product_variants"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
