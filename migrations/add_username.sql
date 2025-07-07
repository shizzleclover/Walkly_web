-- Migration: Add username support to users table
-- This migration adds a username column and updates the trigger function

-- Add username column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username) WHERE username IS NOT NULL;

-- Update the handle_new_user function to include username from auth metadata
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
        trial_start, 
        trial_end, 
        is_premium
      )
      VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), -- Use username from metadata or email prefix
        NOW(), 
        NOW() + INTERVAL '7 days', 
        false
      )
      ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
      
      RAISE LOG 'Created user profile for: % with username: %', NEW.email, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    END IF;
    
    RETURN NEW;
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'User profile already exists for: %', NEW.email;
      RETURN NEW;
    WHEN OTHERS THEN
      RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
      RETURN NEW; -- Don't fail the auth process
  END;
END;
$$; 