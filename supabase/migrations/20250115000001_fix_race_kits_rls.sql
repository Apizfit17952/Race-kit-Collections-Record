-- Fix RLS policy for race_kits to allow authenticated users to insert
-- This resolves the 403 Forbidden error when creating race kits

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only admins can modify race kits" ON public.race_kits;

-- Create separate policies for different operations
-- Allow all authenticated users to insert race kits
CREATE POLICY "Authenticated users can insert race kits" ON public.race_kits 
FOR INSERT TO authenticated 
WITH CHECK (true);

-- Allow all authenticated users to update race kits
CREATE POLICY "Authenticated users can update race kits" ON public.race_kits 
FOR UPDATE TO authenticated 
USING (true);

-- Keep delete restricted to admins/organizers only
CREATE POLICY "Only admins can delete race kits" ON public.race_kits 
FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'organizer')
  )
);
