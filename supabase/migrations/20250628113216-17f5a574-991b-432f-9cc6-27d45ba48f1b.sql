
-- Step 1: Add normalized date columns to both collection and applications tables
ALTER TABLE public.collection 
ADD COLUMN demand_date_normalized DATE;

ALTER TABLE public.applications 
ADD COLUMN demand_date_normalized DATE;

-- Step 2: Create a function to convert mixed date formats to proper dates
CREATE OR REPLACE FUNCTION convert_mixed_date_to_date(input_text TEXT)
RETURNS DATE AS $$
DECLARE
    numeric_value NUMERIC;
    excel_epoch DATE := '1900-01-01'::DATE;
    result_date DATE;
BEGIN
    -- Handle NULL or empty input
    IF input_text IS NULL OR input_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Check if it's a numeric value (Excel serial number)
    BEGIN
        numeric_value := input_text::NUMERIC;
        -- If it's in the Excel serial range (25000-50000 covers our data range)
        IF numeric_value > 25000 AND numeric_value < 50000 THEN
            -- Convert Excel serial to date (subtract 2 for Excel's leap year bug)
            result_date := excel_epoch + (numeric_value - 2)::INTEGER;
            RETURN result_date;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Not a number, continue to next check
    END;
    
    -- Try to parse as a date string
    BEGIN
        -- Try YYYY-MM-DD format
        result_date := input_text::DATE;
        RETURN result_date;
    EXCEPTION WHEN OTHERS THEN
        -- Try YYYY-MM format (add day 05 for EMI dates)
        BEGIN
            IF input_text ~ '^\d{4}-\d{2}$' THEN
                result_date := (input_text || '-05')::DATE;
                RETURN result_date;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- If all parsing fails, return NULL
            RETURN NULL;
        END;
    END;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update collection table with normalized dates
UPDATE public.collection 
SET demand_date_normalized = convert_mixed_date_to_date(demand_date)
WHERE demand_date IS NOT NULL;

-- Step 4: Update applications table with normalized dates
UPDATE public.applications 
SET demand_date_normalized = convert_mixed_date_to_date(demand_date)
WHERE demand_date IS NOT NULL;

-- Step 5: Update related tables to use DATE format
-- Update field_status table
ALTER TABLE public.field_status 
ADD COLUMN demand_date_normalized DATE;

UPDATE public.field_status 
SET demand_date_normalized = convert_mixed_date_to_date(demand_date)
WHERE demand_date IS NOT NULL;

-- Update ptp_dates table
ALTER TABLE public.ptp_dates 
ADD COLUMN demand_date_normalized DATE;

UPDATE public.ptp_dates 
SET demand_date_normalized = convert_mixed_date_to_date(demand_date)
WHERE demand_date IS NOT NULL;

-- Update comments table
ALTER TABLE public.comments 
ADD COLUMN demand_date_normalized DATE;

UPDATE public.comments 
SET demand_date_normalized = convert_mixed_date_to_date(demand_date)
WHERE demand_date IS NOT NULL;

-- Update contact_calling_status table
ALTER TABLE public.contact_calling_status 
ADD COLUMN demand_date_normalized DATE;

UPDATE public.contact_calling_status 
SET demand_date_normalized = convert_mixed_date_to_date(demand_date)
WHERE demand_date IS NOT NULL;

-- Update audit_logs table
ALTER TABLE public.audit_logs 
ADD COLUMN demand_date_normalized DATE;

UPDATE public.audit_logs 
SET demand_date_normalized = convert_mixed_date_to_date(demand_date)
WHERE demand_date IS NOT NULL;

-- Update calling_logs table
ALTER TABLE public.calling_logs 
ADD COLUMN demand_date_normalized DATE;

UPDATE public.calling_logs 
SET demand_date_normalized = convert_mixed_date_to_date(demand_date)
WHERE demand_date IS NOT NULL;

-- Step 6: Replace old columns with new ones (after data verification)
-- Drop old text columns and rename normalized columns
ALTER TABLE public.collection 
DROP COLUMN demand_date,
ADD COLUMN demand_date DATE;

UPDATE public.collection 
SET demand_date = demand_date_normalized;

ALTER TABLE public.collection 
DROP COLUMN demand_date_normalized;

-- Repeat for applications table
ALTER TABLE public.applications 
DROP COLUMN demand_date,
ADD COLUMN demand_date DATE;

UPDATE public.applications 
SET demand_date = demand_date_normalized;

ALTER TABLE public.applications 
DROP COLUMN demand_date_normalized;

-- Repeat for all related tables
ALTER TABLE public.field_status 
DROP COLUMN demand_date,
ADD COLUMN demand_date DATE;

UPDATE public.field_status 
SET demand_date = demand_date_normalized;

ALTER TABLE public.field_status 
DROP COLUMN demand_date_normalized;

ALTER TABLE public.ptp_dates 
DROP COLUMN demand_date,
ADD COLUMN demand_date DATE;

UPDATE public.ptp_dates 
SET demand_date = demand_date_normalized;

ALTER TABLE public.ptp_dates 
DROP COLUMN demand_date_normalized;

ALTER TABLE public.comments 
DROP COLUMN demand_date,
ADD COLUMN demand_date DATE;

UPDATE public.comments 
SET demand_date = demand_date_normalized;

ALTER TABLE public.comments 
DROP COLUMN demand_date_normalized;

ALTER TABLE public.contact_calling_status 
DROP COLUMN demand_date,
ADD COLUMN demand_date DATE;

UPDATE public.contact_calling_status 
SET demand_date = demand_date_normalized;

ALTER TABLE public.contact_calling_status 
DROP COLUMN demand_date_normalized;

ALTER TABLE public.audit_logs 
DROP COLUMN demand_date,
ADD COLUMN demand_date DATE;

UPDATE public.audit_logs 
SET demand_date = demand_date_normalized;

ALTER TABLE public.audit_logs 
DROP COLUMN demand_date_normalized;

ALTER TABLE public.calling_logs 
DROP COLUMN demand_date,
ADD COLUMN demand_date DATE;

UPDATE public.calling_logs 
SET demand_date = demand_date_normalized;

ALTER TABLE public.calling_logs 
DROP COLUMN demand_date_normalized;

-- Step 7: Add indexes for better performance
CREATE INDEX idx_collection_demand_date ON public.collection(demand_date);
CREATE INDEX idx_applications_demand_date ON public.applications(demand_date);
CREATE INDEX idx_field_status_demand_date ON public.field_status(demand_date);
CREATE INDEX idx_ptp_dates_demand_date ON public.ptp_dates(demand_date);
CREATE INDEX idx_comments_demand_date ON public.comments(demand_date);

-- Step 8: Clean up the helper function
DROP FUNCTION convert_mixed_date_to_date(TEXT);
