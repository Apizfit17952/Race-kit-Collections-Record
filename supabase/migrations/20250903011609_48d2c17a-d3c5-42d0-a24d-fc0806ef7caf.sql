-- Create profiles table for system users (organizers/crew)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'crew' CHECK (role IN ('admin', 'organizer', 'crew')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create runners table for marathon participants
CREATE TABLE public.runners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bib_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  category TEXT,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create race kits table
CREATE TABLE public.race_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  runner_id UUID NOT NULL REFERENCES public.runners(id) ON DELETE CASCADE,
  kit_number TEXT NOT NULL UNIQUE,
  contents JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'collected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create representatives table for people collecting on behalf of runners
CREATE TABLE public.representatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_type TEXT NOT NULL DEFAULT 'ic' CHECK (id_type IN ('ic', 'passport', 'driving_license')),
  phone TEXT,
  relationship TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kit collections table to track collection events
CREATE TABLE public.kit_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  race_kit_id UUID NOT NULL REFERENCES public.race_kits(id) ON DELETE CASCADE,
  collected_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  representative_id UUID REFERENCES public.representatives(id) ON DELETE SET NULL,
  collection_type TEXT NOT NULL DEFAULT 'self' CHECK (collection_type IN ('self', 'representative')),
  notes TEXT,
  collected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for runners (readable by all authenticated users)
CREATE POLICY "Authenticated users can view runners" ON public.runners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify runners" ON public.runners FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'organizer')
  )
);

-- Create RLS policies for race kits (readable by all authenticated users)
CREATE POLICY "Authenticated users can view race kits" ON public.race_kits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify race kits" ON public.race_kits FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'organizer')
  )
);

-- Create RLS policies for representatives (readable by all authenticated users)
CREATE POLICY "Authenticated users can view representatives" ON public.representatives FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create representatives" ON public.representatives FOR INSERT TO authenticated WITH CHECK (true);

-- Create RLS policies for kit collections (readable by all authenticated users)
CREATE POLICY "Authenticated users can view kit collections" ON public.kit_collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create kit collections" ON public.kit_collections FOR INSERT TO authenticated WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_runners_updated_at
  BEFORE UPDATE ON public.runners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_race_kits_updated_at
  BEFORE UPDATE ON public.race_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically update race kit status when collected
CREATE OR REPLACE FUNCTION public.update_kit_status_on_collection()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.race_kits 
  SET status = 'collected' 
  WHERE id = NEW.race_kit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_kit_status_after_collection
  AFTER INSERT ON public.kit_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kit_status_on_collection();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email), 
    'crew'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_runners_bib_number ON public.runners(bib_number);
CREATE INDEX idx_race_kits_runner_id ON public.race_kits(runner_id);
CREATE INDEX idx_race_kits_status ON public.race_kits(status);
CREATE INDEX idx_kit_collections_race_kit_id ON public.kit_collections(race_kit_id);
CREATE INDEX idx_kit_collections_collected_by ON public.kit_collections(collected_by_user_id);
CREATE INDEX idx_kit_collections_collected_at ON public.kit_collections(collected_at);