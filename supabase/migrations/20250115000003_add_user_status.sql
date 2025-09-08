-- Add status field to profiles table for soft delete functionality
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Update existing profiles to have 'active' status
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
