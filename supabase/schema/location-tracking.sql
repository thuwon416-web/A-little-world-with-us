-- Location Tracking Schema
-- Admin location tracking with user privacy control

-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role in ('admin', 'user'));

-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  accuracy DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON public.locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_locations_user_timestamp ON public.locations(user_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own locations
CREATE POLICY "locations_select_own_only" ON public.locations
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own locations
CREATE POLICY "locations_insert_own_only" ON public.locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can see all locations
CREATE POLICY "locations_select_admin_all" ON public.locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Users can update their own locations
CREATE POLICY "locations_update_own_only" ON public.locations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own locations
CREATE POLICY "locations_delete_own_only" ON public.locations
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Admins can delete any location
CREATE POLICY "locations_delete_admin_all" ON public.locations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Note: Role management should be handled through application-level admin functions
-- The existing "profiles_own_data_only" policy allows users to update their own profile
-- Role changes should be validated in the application layer using Supabase client admin functions
