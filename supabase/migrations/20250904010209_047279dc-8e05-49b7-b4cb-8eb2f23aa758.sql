-- Add new columns to runners table for participant_id and race_distance
ALTER TABLE public.runners 
ADD COLUMN participant_id TEXT UNIQUE,
ADD COLUMN race_distance TEXT;

-- Update existing runners with sequential participant IDs (optional, for existing data)
UPDATE public.runners 
SET participant_id = 'P' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0')
WHERE participant_id IS NULL;