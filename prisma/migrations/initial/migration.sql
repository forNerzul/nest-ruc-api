-- CreateTable
CREATE TABLE "contribuyentes" (
    "id" SERIAL NOT NULL,
    "ruc" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "digitoVerif" TEXT NOT NULL,
    "rucAnterior" TEXT,
    "estado" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUpdate" TIMESTAMP(3) NOT NULL,
    "fuente" TEXT NOT NULL,

    CONSTRAINT "contribuyentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contribuyentes_ruc_key" ON "contribuyentes"("ruc");

-- CreateIndex
CREATE INDEX "contribuyentes_ruc_idx" ON "contribuyentes"("ruc"); 