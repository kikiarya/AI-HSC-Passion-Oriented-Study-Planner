-- =========================================
-- Teacher Portal Additional Tables
-- =========================================
-- This script creates tables required for the teacher portal functionality
-- Run this in your Supabase SQL Editor

-- =========================================
-- 1. Student Notes Table
-- =========================================
-- Allows teachers to save private notes about students

CREATE TABLE IF NOT EXISTS public.student_notes (
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (student_id, teacher_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS student_notes_student_idx ON public.student_notes(student_id);
CREATE INDEX IF NOT EXISTS student_notes_teacher_idx ON public.student_notes(teacher_id);

-- Enable Row Level Security
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_notes
-- Teachers can only read/write notes they created
CREATE POLICY IF NOT EXISTS "student_notes_select_own"
  ON public.student_notes FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin());

CREATE POLICY IF NOT EXISTS "student_notes_insert_own"
  ON public.student_notes FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid() OR public.is_admin());

CREATE POLICY IF NOT EXISTS "student_notes_update_own"
  ON public.student_notes FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin());

CREATE POLICY IF NOT EXISTS "student_notes_delete_own"
  ON public.student_notes FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin());

-- =========================================
-- 2. Class Announcements Table
-- =========================================
-- Allows teachers to post announcements to their classes

CREATE TABLE IF NOT EXISTS public.class_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS class_announcements_class_idx ON public.class_announcements(class_id);
CREATE INDEX IF NOT EXISTS class_announcements_creator_idx ON public.class_announcements(created_by);
CREATE INDEX IF NOT EXISTS class_announcements_created_at_idx ON public.class_announcements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.class_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_announcements
-- Teachers can read announcements for their classes
CREATE POLICY IF NOT EXISTS "announcements_select_teacher"
  ON public.class_announcements FOR SELECT
  TO authenticated
  USING (
    public.is_class_teacher(class_id)
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.class_id = class_id
        AND e.student_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Teachers can create announcements for their classes
CREATE POLICY IF NOT EXISTS "announcements_insert_teacher"
  ON public.class_announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_class_teacher(class_id) OR public.is_admin()
  );

-- Teachers can update their own announcements
CREATE POLICY IF NOT EXISTS "announcements_update_own"
  ON public.class_announcements FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

-- Teachers can delete their own announcements
CREATE POLICY IF NOT EXISTS "announcements_delete_own"
  ON public.class_announcements FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

-- =========================================
-- 3. Update trigger for updated_at timestamps
-- =========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for student_notes
DROP TRIGGER IF EXISTS update_student_notes_updated_at ON public.student_notes;
CREATE TRIGGER update_student_notes_updated_at
  BEFORE UPDATE ON public.student_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for class_announcements
DROP TRIGGER IF EXISTS update_class_announcements_updated_at ON public.class_announcements;
CREATE TRIGGER update_class_announcements_updated_at
  BEFORE UPDATE ON public.class_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 4. Grants
-- =========================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_announcements TO authenticated;

-- =========================================
-- Verification Queries
-- =========================================

-- Run these queries to verify the tables were created correctly:

-- Check student_notes table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'student_notes'
-- ORDER BY ordinal_position;

-- Check class_announcements table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'class_announcements'
-- ORDER BY ordinal_position;

-- Check RLS policies
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('student_notes', 'class_announcements')
-- ORDER BY tablename, policyname;


