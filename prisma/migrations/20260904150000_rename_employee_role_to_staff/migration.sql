-- Hand-written (like the other enum-touching migrations in this project) —
-- `prisma migrate dev` won't run non-interactively for a change that looks
-- destructive to an enum. This one is a pure rename, not a removal: Postgres
-- supports renaming an enum value in place since PG10, so every existing
-- row that was "EMPLOYEE" becomes "STAFF" automatically with no data loss
-- and no need to touch the users table itself.
ALTER TYPE "UserRole" RENAME VALUE 'EMPLOYEE' TO 'STAFF';
