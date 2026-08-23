-- 2026-08-23. Adds the two columns the V3 registration form introduced.
--
-- WHY THIS FILE EXISTS: schema.sql uses CREATE TABLE IF NOT EXISTS, so editing
-- it to add a column is a no-op against a database where the table already
-- exists. The columns were added to schema.sql, the file was re-run, D1
-- reported success, and every INSERT then failed with "no such column" — a
-- silent schema drift that only surfaced as a 500 on the live endpoint.
--
-- From here: schema.sql describes a FRESH database. Any change to an existing
-- one is a numbered file in this directory, applied in order.
ALTER TABLE submissions ADD COLUMN participation TEXT;
ALTER TABLE submissions ADD COLUMN website TEXT;
