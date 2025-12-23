-- Create selected_subjects table
-- This table stores HSC subjects that students have selected after receiving AI recommendations

CREATE TABLE IF NOT EXISTS selected_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_code VARCHAR(50) NOT NULL,
  subject_name TEXT NOT NULL,
  category VARCHAR(100),
  reasoning TEXT,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on student_id for faster queries
CREATE INDEX IF NOT EXISTS idx_selected_subjects_student_id ON selected_subjects(student_id);

-- Create unique constraint to prevent duplicate selections
CREATE UNIQUE INDEX IF NOT EXISTS idx_selected_subjects_unique 
ON selected_subjects(student_id, subject_code, subject_name);

-- Add comment to table
COMMENT ON TABLE selected_subjects IS 'Stores HSC subjects selected by students after AI recommendations';

-- Add comments to columns
COMMENT ON COLUMN selected_subjects.id IS 'Unique identifier for the selected subject record';
COMMENT ON COLUMN selected_subjects.student_id IS 'Reference to the student (profiles table)';
COMMENT ON COLUMN selected_subjects.subject_code IS 'HSC subject code (e.g., ENG-ADV, MATH-EXT1)';
COMMENT ON COLUMN selected_subjects.subject_name IS 'Full name of the HSC subject';
COMMENT ON COLUMN selected_subjects.category IS 'Subject category (e.g., Mathematics, Science, English)';
COMMENT ON COLUMN selected_subjects.reasoning IS 'AI-generated reasoning for why this subject was recommended';
COMMENT ON COLUMN selected_subjects.selected_at IS 'Timestamp when the student selected this subject';
COMMENT ON COLUMN selected_subjects.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN selected_subjects.updated_at IS 'Record last update timestamp';

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_selected_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_selected_subjects_updated_at
  BEFORE UPDATE ON selected_subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_selected_subjects_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE selected_subjects ENABLE ROW LEVEL SECURITY;

-- Policy: Students can only view their own selected subjects
CREATE POLICY selected_subjects_select_policy ON selected_subjects
  FOR SELECT
  USING (auth.uid() = student_id);

-- Policy: Students can only insert their own selected subjects
CREATE POLICY selected_subjects_insert_policy ON selected_subjects
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Policy: Students can only update their own selected subjects
CREATE POLICY selected_subjects_update_policy ON selected_subjects
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Policy: Students can only delete their own selected subjects
CREATE POLICY selected_subjects_delete_policy ON selected_subjects
  FOR DELETE
  USING (auth.uid() = student_id);

-- Policy: Teachers can view selected subjects of their students (if needed)
-- Uncomment if teachers need access
-- CREATE POLICY selected_subjects_teacher_view_policy ON selected_subjects
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM enrollments e
--       JOIN class_teachers ct ON ct.class_id = e.class_id
--       WHERE e.student_id = selected_subjects.student_id
--       AND ct.profile_id = auth.uid()
--     )
--   );

