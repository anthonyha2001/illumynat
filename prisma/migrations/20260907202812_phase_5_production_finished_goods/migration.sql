-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "production_batches" (
    "id" UUID NOT NULL,
    "recipeVersionId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PENDING',
    "targetQuantity" INTEGER NOT NULL,
    "actualQuantity" INTEGER,
    "failedQuantity" INTEGER,
    "totalMaterialCost" DECIMAL(12,4),
    "costPerUnit" DECIMAL(10,6),
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_deductions" (
    "id" UUID NOT NULL,
    "productionBatchId" UUID NOT NULL,
    "rawMaterialId" UUID NOT NULL,
    "quantityDeducted" DECIMAL(12,4) NOT NULL,
    "costPerUnit" DECIMAL(10,6) NOT NULL,
    "totalCost" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finished_goods" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finished_goods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finished_goods_productId_key" ON "finished_goods"("productId");

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_recipeVersionId_fkey" FOREIGN KEY ("recipeVersionId") REFERENCES "recipe_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_batches" ADD CONSTRAINT "production_batches_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_deductions" ADD CONSTRAINT "batch_deductions_productionBatchId_fkey" FOREIGN KEY ("productionBatchId") REFERENCES "production_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_deductions" ADD CONSTRAINT "batch_deductions_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_goods" ADD CONSTRAINT "finished_goods_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
