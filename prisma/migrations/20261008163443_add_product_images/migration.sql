-- CreateTable
CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_uuid" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_images_product_uuid_sort_order_idx" ON "product_images"("product_uuid", "sort_order");

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_uuid_fkey" FOREIGN KEY ("product_uuid") REFERENCES "products"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
