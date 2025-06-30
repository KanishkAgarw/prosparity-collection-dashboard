
-- First, let's identify and clean up duplicate records in contact_calling_status
-- Keep only the most recent record for each unique combination
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY application_id, contact_type, demand_date 
      ORDER BY created_at DESC, updated_at DESC
    ) as rn
  FROM public.contact_calling_status
  WHERE demand_date IS NOT NULL
)
DELETE FROM public.contact_calling_status 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Also clean up any potential duplicates in field_status table
WITH field_duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY application_id, demand_date 
      ORDER BY created_at DESC, updated_at DESC
    ) as rn
  FROM public.field_status
  WHERE demand_date IS NOT NULL
)
DELETE FROM public.field_status 
WHERE id IN (
  SELECT id FROM field_duplicates WHERE rn > 1
);

-- Clean up any potential duplicates in collection table
WITH collection_duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY application_id, demand_date 
      ORDER BY created_at DESC, updated_at DESC
    ) as rn
  FROM public.collection
  WHERE demand_date IS NOT NULL
)
DELETE FROM public.collection 
WHERE id IN (
  SELECT id FROM collection_duplicates WHERE rn > 1
);

-- Now add the unique constraints
-- 1. Add unique constraint for field_status table (only where demand_date is not null)
CREATE UNIQUE INDEX field_status_application_demand_unique 
ON public.field_status (application_id, demand_date) 
WHERE demand_date IS NOT NULL;

-- 2. Add unique constraint for contact_calling_status table (only where demand_date is not null)
CREATE UNIQUE INDEX contact_calling_status_app_contact_demand_unique 
ON public.contact_calling_status (application_id, contact_type, demand_date) 
WHERE demand_date IS NOT NULL;

-- 3. Add unique constraint for collection table (only where demand_date is not null)
CREATE UNIQUE INDEX collection_application_demand_unique 
ON public.collection (application_id, demand_date) 
WHERE demand_date IS NOT NULL;
