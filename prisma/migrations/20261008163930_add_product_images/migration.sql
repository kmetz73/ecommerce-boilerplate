-- Lesson 25: Rename image URL to MinIO object key
-- Preserve existing product_images table

ALTER TABLE "product_images"
RENAME COLUMN "url" TO "object_key";

-- Prevent duplicate MinIO object references
CREATE UNIQUE INDEX "product_images_object_key_key"
ON "product_images"("object_key");