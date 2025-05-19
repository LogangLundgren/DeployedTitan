-- Add the new coach-related fields to the workouts table
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS coach_notes TEXT,
ADD COLUMN IF NOT EXISTS coach_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();