-- CreateTable
CREATE TABLE "product_variants" (
    "uuid" UUID NOT NULL,
    "product_uuid" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "option_values" JSONB NOT NULL,
    "price_cents" INTEGER,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_uuid_idx" ON "product_variants"("product_uuid");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
