-- Create incorrect_questions table to store student's wrong answers
-- This table stores questions that students answered incorrectly during practice

CREATE TABLE IF NOT EXISTS public.incorrect_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.practice_questions(id) ON DELETE CASCADE,
  
  -- Question details (denormalized for faster access)
  question TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  subject_code VARCHAR(50),
  points INTEGER DEFAULT 10,
  
  -- Answer details
  student_answer TEXT NOT NULL,
  correct_answer TEXT,
  explanation TEXT,
  
  -- Options for multiple choice (stored as JSON)
  options JSONB,
  
  -- Review tracking
  review_count INTEGER DEFAULT 0,
  mastery_level TEXT DEFAULT 'Needs Review', -- 'Needs Review', 'Practicing', 'Mastered'
  next_review_date TIMESTAMPTZ,
  
  -- Timestamps
  first_answered_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a question is only stored once per student
  UNIQUE(student_id, question_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_incorrect_questions_student_id 
  ON public.incorrect_questions(student_id);

CREATE INDEX IF NOT EXISTS idx_incorrect_questions_subject 
  ON public.incorrect_questions(subject);

CREATE INDEX IF NOT EXISTS idx_incorrect_questions_mastery 
  ON public.incorrect_questions(mastery_level);

-- Enable Row Level Security
ALTER TABLE public.incorrect_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can only access their own incorrect questions
CREATE POLICY "students_can_view_own_incorrect_questions"
  ON public.incorrect_questions
  FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "students_can_insert_own_incorrect_questions"
  ON public.incorrect_questions
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "students_can_update_own_incorrect_questions"
  ON public.incorrect_questions
  FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "students_can_delete_own_incorrect_questions"
  ON public.incorrect_questions
  FOR DELETE
  USING (student_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_incorrect_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_incorrect_questions_updated_at
  BEFORE UPDATE ON public.incorrect_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_incorrect_questions_updated_at();

-- Add comments
COMMENT ON TABLE public.incorrect_questions IS 'Stores questions that students answered incorrectly for review purposes';
COMMENT ON COLUMN public.incorrect_questions.student_id IS 'Reference to the student who answered incorrectly';
COMMENT ON COLUMN public.incorrect_questions.question_id IS 'Reference to the original practice question';
COMMENT ON COLUMN public.incorrect_questions.mastery_level IS 'Current mastery level: Needs Review, Practicing, or Mastered';

