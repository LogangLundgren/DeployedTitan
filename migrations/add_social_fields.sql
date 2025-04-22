-- Add caption and mediaUrls to the workouts table
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS caption TEXT,
ADD COLUMN IF NOT EXISTS media_urls TEXT,
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;