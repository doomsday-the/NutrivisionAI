-- CreateIndex
CREATE UNIQUE INDEX "food_items_source_id_external_id_key" ON "food_items"("source_id", "external_id");
