-- Purely additive (new column with a default), so this runs fine through
-- the normal `prisma migrate deploy` step in `npm run build` — no hand-run
-- needed, unlike the enum-touching migrations elsewhere in this project.
ALTER TABLE "menu_items" ADD COLUMN "isRetired" BOOLEAN NOT NULL DEFAULT false;
