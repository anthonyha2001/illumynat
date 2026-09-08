-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('GRAM', 'KILOGRAM', 'MILLILITER', 'LITER', 'OUNCE', 'PIECE', 'METER', 'CENTIMETER');

-- CreateTable
CREATE TABLE "raw_materials" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "consumptionUnit" "UnitOfMeasure" NOT NULL,
    "purchaseUnit" "UnitOfMeasure" NOT NULL,
    "conversionFactor" DECIMAL(10,6) NOT NULL,
    "currentStock" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "reorderThreshold" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_lots" (
    "id" UUID NOT NULL,
    "rawMaterialId" UUID NOT NULL,
    "quantityPurchased" DECIMAL(12,4) NOT NULL,
    "costPerPurchaseUnit" DECIMAL(10,6) NOT NULL,
    "quantityReceived" DECIMAL(12,4) NOT NULL,
    "costPerUnit" DECIMAL(10,6) NOT NULL,
    "totalCost" DECIMAL(12,4) NOT NULL,
    "avgCostBefore" DECIMAL(10,6) NOT NULL,
    "avgCostAfter" DECIMAL(10,6) NOT NULL,
    "supplier" TEXT,
    "notes" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_lots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_materials_name_key" ON "raw_materials"("name");

-- AddForeignKey
ALTER TABLE "stock_lots" ADD CONSTRAINT "stock_lots_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
