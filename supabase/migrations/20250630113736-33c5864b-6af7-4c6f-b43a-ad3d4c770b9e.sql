
-- Add the missing unique constraint for the collection table
-- This constraint is needed for the upsert operations to work properly
CREATE UNIQUE INDEX IF NOT EXISTS collection_application_demand_unique 
ON public.collection (application_id, demand_date) 
WHERE demand_date IS NOT NULL;
