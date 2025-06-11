
-- Add collection_rm column to the applications table
ALTER TABLE public.applications 
ADD COLUMN collection_rm text;

-- Add an index for better filtering performance
CREATE INDEX idx_applications_collection_rm ON public.applications(collection_rm);
