-- Fix incorrect_questions table - add missing columns
-- Run this in Supabase SQL Editor

-- Check if first_answered_at column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' 
    AND column_name = 'first_answered_at'
  ) THEN
    ALTER TABLE incorrect_questions 
    ADD COLUMN first_answered_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added first_answered_at column';
  ELSE
    RAISE NOTICE '✓ first_answered_at column already exists';
  END IF;
END $$;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incorrect_questions'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ incorrect_questions table fixed!';
  RAISE NOTICE '   All required columns are now present.';
END $$;

