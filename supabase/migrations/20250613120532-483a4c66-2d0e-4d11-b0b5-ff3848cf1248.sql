
-- Create analytics snapshots table for storing daily aggregated data
CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  branch_name TEXT NOT NULL,
  rm_name TEXT,
  
  -- Payment status counts
  total_applications INTEGER NOT NULL DEFAULT 0,
  unpaid_count INTEGER NOT NULL DEFAULT 0,
  partially_paid_count INTEGER NOT NULL DEFAULT 0,
  paid_pending_approval_count INTEGER NOT NULL DEFAULT 0,
  paid_count INTEGER NOT NULL DEFAULT 0,
  others_count INTEGER NOT NULL DEFAULT 0,
  
  -- PTP status counts
  ptp_total INTEGER NOT NULL DEFAULT 0,
  ptp_overdue INTEGER NOT NULL DEFAULT 0,
  ptp_today INTEGER NOT NULL DEFAULT 0,
  ptp_tomorrow INTEGER NOT NULL DEFAULT 0,
  ptp_future INTEGER NOT NULL DEFAULT 0,
  ptp_no_ptp_set INTEGER NOT NULL DEFAULT 0,
  
  -- Collection metrics
  total_emi_amount NUMERIC DEFAULT 0,
  total_principle_due NUMERIC DEFAULT 0,
  total_interest_due NUMERIC DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_analytics_snapshots_date ON public.analytics_snapshots(snapshot_date);
CREATE INDEX idx_analytics_snapshots_branch ON public.analytics_snapshots(branch_name);
CREATE INDEX idx_analytics_snapshots_rm ON public.analytics_snapshots(rm_name);
CREATE INDEX idx_analytics_snapshots_date_branch ON public.analytics_snapshots(snapshot_date, branch_name);

-- Create unique constraint to prevent duplicate snapshots
CREATE UNIQUE INDEX idx_analytics_snapshots_unique ON public.analytics_snapshots(snapshot_date, branch_name, COALESCE(rm_name, ''));

-- Enable RLS
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all analytics snapshots" 
  ON public.analytics_snapshots 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert analytics snapshots" 
  ON public.analytics_snapshots 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update analytics snapshots" 
  ON public.analytics_snapshots 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Create function to generate analytics snapshot for a specific date
CREATE OR REPLACE FUNCTION public.generate_analytics_snapshot(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  snapshot_count INTEGER;
BEGIN
  -- Delete existing snapshot for this date to prevent duplicates
  DELETE FROM public.analytics_snapshots WHERE snapshot_date = target_date;
  
  -- Generate new snapshot
  INSERT INTO public.analytics_snapshots (
    snapshot_date,
    branch_name,
    rm_name,
    total_applications,
    unpaid_count,
    partially_paid_count,
    paid_pending_approval_count,
    paid_count,
    others_count,
    ptp_total,
    ptp_overdue,
    ptp_today,
    ptp_tomorrow,
    ptp_future,
    ptp_no_ptp_set,
    total_emi_amount,
    total_principle_due,
    total_interest_due
  )
  SELECT 
    target_date,
    a.branch_name,
    COALESCE(a.collection_rm, a.rm_name) as rm_name,
    COUNT(*) as total_applications,
    
    -- Payment status counts
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) = 'Unpaid' THEN 1 ELSE 0 END) as unpaid_count,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) = 'Partially Paid' THEN 1 ELSE 0 END) as partially_paid_count,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) = 'Paid (Pending Approval)' THEN 1 ELSE 0 END) as paid_pending_approval_count,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) = 'Paid' THEN 1 ELSE 0 END) as paid_count,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) NOT IN ('Unpaid', 'Partially Paid', 'Paid (Pending Approval)', 'Paid') THEN 1 ELSE 0 END) as others_count,
    
    -- PTP status counts (only for non-paid applications)
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) != 'Paid' THEN 1 ELSE 0 END) as ptp_total,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) != 'Paid' AND ptp.ptp_date IS NOT NULL AND ptp.ptp_date < target_date THEN 1 ELSE 0 END) as ptp_overdue,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) != 'Paid' AND ptp.ptp_date::date = target_date THEN 1 ELSE 0 END) as ptp_today,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) != 'Paid' AND ptp.ptp_date::date = target_date + INTERVAL '1 day' THEN 1 ELSE 0 END) as ptp_tomorrow,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) != 'Paid' AND ptp.ptp_date IS NOT NULL AND ptp.ptp_date::date > target_date + INTERVAL '1 day' THEN 1 ELSE 0 END) as ptp_future,
    SUM(CASE WHEN COALESCE(fs.status, a.lms_status) != 'Paid' AND ptp.ptp_date IS NULL THEN 1 ELSE 0 END) as ptp_no_ptp_set,
    
    -- Collection metrics
    SUM(a.emi_amount) as total_emi_amount,
    SUM(a.principle_due) as total_principle_due,
    SUM(a.interest_due) as total_interest_due
    
  FROM public.applications a
  LEFT JOIN LATERAL (
    SELECT status 
    FROM public.field_status fs 
    WHERE fs.application_id = a.applicant_id 
      AND fs.created_at <= target_date + INTERVAL '1 day'
    ORDER BY fs.created_at DESC 
    LIMIT 1
  ) fs ON true
  LEFT JOIN LATERAL (
    SELECT ptp_date 
    FROM public.ptp_dates pd 
    WHERE pd.application_id = a.applicant_id 
      AND pd.created_at <= target_date + INTERVAL '1 day'
    ORDER BY pd.created_at DESC 
    LIMIT 1
  ) ptp ON true
  WHERE a.created_at <= target_date + INTERVAL '1 day'
  GROUP BY a.branch_name, COALESCE(a.collection_rm, a.rm_name);

  GET DIAGNOSTICS snapshot_count = ROW_COUNT;
  
  RETURN 'Generated ' || snapshot_count || ' analytics snapshot records for ' || target_date;
END;
$$;

-- Create function to backfill historical snapshots
CREATE OR REPLACE FUNCTION public.backfill_analytics_snapshots(start_date DATE, end_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  iter_date DATE;
  result_text TEXT := '';
BEGIN
  iter_date := start_date;
  
  WHILE iter_date <= end_date LOOP
    result_text := result_text || generate_analytics_snapshot(iter_date) || E'\n';
    iter_date := iter_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN result_text;
END;
$$;
