-- Add new columns to runners table for participant_id and race_distance
ALTER TABLE public.runners 
ADD COLUMN participant_id TEXT UNIQUE,
ADD COLUMN race_distance TEXT;