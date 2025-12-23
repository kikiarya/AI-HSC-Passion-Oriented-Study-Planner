-- =========================================
-- Add columns for Study Plan feature (UC2)
-- =========================================
-- Run this in your Supabase SQL Editor

-- =========================================
-- 1. Add study_preferences column to profiles table
-- =========================================
-- This stores user learning preferences for personalized study plans

DO $$ 
BEGIN
  -- Check if column exists before adding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'study_preferences'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN study_preferences JSONB DEFAULT '{}'::jsonb;
    
    RAISE NOTICE 'Added study_preferences column to profiles table';
  ELSE
    RAISE NOTICE 'study_preferences column already exists in profiles table';
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.study_preferences IS 
'Stores student learning preferences including learning_style, study_time_preference, break_frequency, etc. for AI-powered study plan generation';

-- =========================================
-- 2. Add subject column to classes table
-- =========================================
-- This allows querying assignments/submissions by subject

DO $$ 
BEGIN
  -- Check if column exists before adding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'classes' 
    AND column_name = 'subject'
  ) THEN
    ALTER TABLE public.classes 
    ADD COLUMN subject TEXT;
    
    RAISE NOTICE 'Added subject column to classes table';
  ELSE
    RAISE NOTICE 'subject column already exists in classes table';
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.classes.subject IS 
'Subject name for the class (e.g., Mathematics, Physics, Chemistry). Used for grouping and filtering in study plans.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS classes_subject_idx ON public.classes(subject);

-- =========================================
-- 3. Update existing classes with subject names
-- =========================================
-- Extract subject from class name where possible

-- Update classes with recognizable subject names
UPDATE public.classes 
SET subject = CASE
  WHEN name ILIKE '%math%' THEN 'Mathematics'
  WHEN name ILIKE '%physic%' THEN 'Physics'
  WHEN name ILIKE '%chemistry%' OR name ILIKE '%chem%' THEN 'Chemistry'
  WHEN name ILIKE '%biology%' OR name ILIKE '%bio%' THEN 'Biology'
  WHEN name ILIKE '%english%' THEN 'English'
  WHEN name ILIKE '%history%' THEN 'History'
  WHEN name ILIKE '%geography%' OR name ILIKE '%geo%' THEN 'Geography'
  WHEN name ILIKE '%computer%' OR name ILIKE '%software%' OR name ILIKE '%elec%' THEN 'Computer Science'
  WHEN name ILIKE '%business%' OR name ILIKE '%commerce%' THEN 'Business Studies'
  WHEN name ILIKE '%economics%' OR name ILIKE '%econ%' THEN 'Economics'
  WHEN name ILIKE '%visual arts%' OR name ILIKE '%art%' THEN 'Visual Arts'
  WHEN name ILIKE '%music%' THEN 'Music'
  WHEN name ILIKE '%pdhpe%' OR name ILIKE '%pe%' THEN 'PDHPE'
  ELSE name -- Default to class name if no match
END
WHERE subject IS NULL;

-- =========================================
-- 4. Verification Queries
-- =========================================

-- Check if columns were added successfully
SELECT 
  table_name,
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'classes')
  AND column_name IN ('study_preferences', 'subject')
ORDER BY table_name, column_name;

-- Check updated classes
SELECT id, code, name, subject
FROM public.classes
ORDER BY subject, name
LIMIT 20;

-- =========================================
-- Success Message
-- =========================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Study Plan columns added successfully!';
  RAISE NOTICE '📚 profiles.study_preferences - stores learning preferences';
  RAISE NOTICE '📚 classes.subject - stores subject names for filtering';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Next steps:';
  RAISE NOTICE '1. Verify columns with the SELECT queries above';
  RAISE NOTICE '2. Manually update any classes with incorrect subject values';
  RAISE NOTICE '3. Restart your backend server';
  RAISE NOTICE '4. Test the Study Planner feature';
END $$;

