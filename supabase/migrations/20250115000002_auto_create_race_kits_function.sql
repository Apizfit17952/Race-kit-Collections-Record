-- Create function to automatically create race kits when runners are inserted
CREATE OR REPLACE FUNCTION public.auto_create_race_kit()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a race kit for the new runner
  INSERT INTO public.race_kits (
    runner_id,
    kit_number,
    status,
    contents
  ) VALUES (
    NEW.id,
    NEW.bib_number,
    'pending',
    '[]'::jsonb
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to automatically create race kits when runners are inserted
CREATE TRIGGER auto_create_race_kit_trigger
  AFTER INSERT ON public.runners
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_race_kit();
