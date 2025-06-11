
-- Check if collection_rm column exists and add it if missing
-- The column already exists in the applications table schema, so no changes needed

-- Verify the column exists (this is just for confirmation)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'applications' 
AND column_name = 'collection_rm';
