-- AlterTable
ALTER TABLE "User" ADD COLUMN     "botEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN     "operatorTakenOverAt" TIMESTAMP(3);
