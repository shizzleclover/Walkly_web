-- Migration: Enhance profile features and add walks tracking
-- This migration adds bio and avatar_url to users table and creates walks table

-- Add missing profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 500),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for updated_at
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at);

-- Create walks table for activity tracking
CREATE TABLE IF NOT EXISTS public.walks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  distance DECIMAL(10,2), -- Distance in kilometers
  duration INTEGER, -- Duration in seconds
  start_latitude DECIMAL(10,8),
  start_longitude DECIMAL(11,8),
  end_latitude DECIMAL(10,8),
  end_longitude DECIMAL(11,8),
  route_data JSONB, -- Store route coordinates and waypoints
  moments JSONB, -- Store photos and notes from the walk
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for walks table
CREATE INDEX IF NOT EXISTS idx_walks_user_id ON public.walks(user_id);
CREATE INDEX IF NOT EXISTS idx_walks_created_at ON public.walks(created_at);
CREATE INDEX IF NOT EXISTS idx_walks_distance ON public.walks(distance);

-- Enable RLS on walks table
ALTER TABLE public.walks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for walks table
CREATE POLICY "Users can view their own walks" ON public.walks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own walks" ON public.walks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own walks" ON public.walks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own walks" ON public.walks
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_walks_updated_at 
  BEFORE UPDATE ON public.walks 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  BEGIN
    -- Only create profile if user is email confirmed or this is a direct insert
    IF NEW.email_confirmed_at IS NOT NULL OR NEW.confirmation_sent_at IS NULL THEN
      INSERT INTO public.users (
        id, 
        email, 
        username,
        bio,
        avatar_url,
        onboarding_completed,
        trial_start, 
        trial_end, 
        is_premium,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'bio',
        NEW.raw_user_meta_data->>'avatar_url',
        false,
        NOW(), 
        NOW() + INTERVAL '7 days', 
        false,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, users.username),
        bio = COALESCE(EXCLUDED.bio, users.bio),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        onboarding_completed = COALESCE(EXCLUDED.onboarding_completed, users.onboarding_completed),
        updated_at = NOW();
      
      RAISE LOG 'Created/updated user profile for: % with username: %', NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    END IF;
    
    RETURN NEW;
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Username conflict for user: %, will retry with unique username', NEW.email;
      RETURN NEW;
    WHEN OTHERS THEN
      RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
      RETURN NEW; -- Don't fail the auth process
  END;
END;
$$;

-- Enhanced walks table for the new map system with better structure
CREATE TABLE IF NOT EXISTS public.walks_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  total_distance INTEGER DEFAULT 0, -- Total distance in meters
  total_duration INTEGER DEFAULT 0, -- Total duration in seconds
  route_path JSONB, -- Array of [lng, lat] coordinates for the actual path walked
  planned_route JSONB, -- Array of [lng, lat] coordinates for the planned route
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create walk_moments table for tracking moments during walks
CREATE TABLE IF NOT EXISTS public.walk_moments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  walk_id UUID NOT NULL REFERENCES public.walks_enhanced(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  photo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_walks_enhanced_user_id ON public.walks_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_walks_enhanced_status ON public.walks_enhanced(status);
CREATE INDEX IF NOT EXISTS idx_walks_enhanced_start_time ON public.walks_enhanced(start_time);
CREATE INDEX IF NOT EXISTS idx_walk_moments_walk_id ON public.walk_moments(walk_id);
CREATE INDEX IF NOT EXISTS idx_walk_moments_created_at ON public.walk_moments(created_at);

-- Enable RLS for enhanced tables
ALTER TABLE public.walks_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walk_moments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for walks_enhanced
CREATE POLICY "Users can view own enhanced walks" ON public.walks_enhanced FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own enhanced walks" ON public.walks_enhanced FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enhanced walks" ON public.walks_enhanced FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own enhanced walks" ON public.walks_enhanced FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for walk_moments (users can only access moments from their own walks)
CREATE POLICY "Users can view own walk moments" ON public.walk_moments FOR SELECT 
USING (walk_id IN (SELECT id FROM public.walks_enhanced WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own walk moments" ON public.walk_moments FOR INSERT 
WITH CHECK (walk_id IN (SELECT id FROM public.walks_enhanced WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own walk moments" ON public.walk_moments FOR UPDATE 
USING (walk_id IN (SELECT id FROM public.walks_enhanced WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own walk moments" ON public.walk_moments FOR DELETE 
USING (walk_id IN (SELECT id FROM public.walks_enhanced WHERE user_id = auth.uid()));

-- Create triggers for updated_at on enhanced tables
CREATE TRIGGER update_walks_enhanced_updated_at 
  BEFORE UPDATE ON public.walks_enhanced 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 