-- ==========================================
-- 完整修复 incorrect_questions 表结构
-- 添加所有缺失的列
-- ==========================================

-- 1. 添加缺失的列
DO $$ 
BEGIN
  -- question (题目文本)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'question'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN question TEXT;
    RAISE NOTICE '✅ Added question column';
  END IF;

  -- type (题目类型)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'type'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN type TEXT NOT NULL DEFAULT 'multiple_choice';
    RAISE NOTICE '✅ Added type column';
  END IF;

  -- subject_code (科目代码)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'subject_code'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN subject_code VARCHAR(50);
    RAISE NOTICE '✅ Added subject_code column';
  END IF;

  -- points (分值)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'points'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN points INTEGER DEFAULT 10;
    RAISE NOTICE '✅ Added points column';
  END IF;

  -- student_answer (学生答案)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'student_answer'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN student_answer TEXT;
    RAISE NOTICE '✅ Added student_answer column';
  END IF;

  -- explanation (解释)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'explanation'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN explanation TEXT;
    RAISE NOTICE '✅ Added explanation column';
  END IF;

  -- options (选项, JSONB格式)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'options'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN options JSONB;
    RAISE NOTICE '✅ Added options column';
  END IF;

  -- review_count (复习次数)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN review_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added review_count column';
  END IF;

  -- mastery_level (掌握程度)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'mastery_level'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN mastery_level TEXT DEFAULT 'Needs Review';
    RAISE NOTICE '✅ Added mastery_level column';
  END IF;

  -- next_review_date (下次复习日期)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'next_review_date'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN next_review_date TIMESTAMPTZ;
    RAISE NOTICE '✅ Added next_review_date column';
  END IF;

  -- first_answered_at (首次回答时间)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'first_answered_at'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN first_answered_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added first_answered_at column';
  END IF;

  -- last_reviewed_at (最后复习时间)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'last_reviewed_at'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN last_reviewed_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added last_reviewed_at column';
  END IF;

  -- created_at (创建时间)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added created_at column';
  END IF;

  -- updated_at (更新时间)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incorrect_questions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE incorrect_questions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column';
  END IF;

END $$;

-- 2. 添加唯一约束（如果不存在）
DO $$
BEGIN
  -- 检查唯一约束是否存在
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'incorrect_questions_student_question_unique'
  ) THEN
    -- 先删除可能的重复数据
    DELETE FROM incorrect_questions a USING incorrect_questions b
    WHERE a.id > b.id 
      AND a.student_id = b.student_id 
      AND a.question_id = b.question_id;
    
    -- 添加唯一约束
    ALTER TABLE incorrect_questions
    ADD CONSTRAINT incorrect_questions_student_question_unique
    UNIQUE (student_id, question_id);
    
    RAISE NOTICE '✅ Added UNIQUE constraint on (student_id, question_id)';
  ELSE
    RAISE NOTICE '✓ UNIQUE constraint already exists';
  END IF;
END $$;

-- 3. 创建或更新触发器
CREATE OR REPLACE FUNCTION update_incorrect_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_incorrect_questions_updated_at ON incorrect_questions;
CREATE TRIGGER trigger_update_incorrect_questions_updated_at
  BEFORE UPDATE ON incorrect_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_incorrect_questions_updated_at();

-- 4. 验证表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'incorrect_questions'
ORDER BY ordinal_position;

-- 成功消息
DO $$ 
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ incorrect_questions table structure fixed!';
  RAISE NOTICE '   All required columns are now present.';
  RAISE NOTICE '';
  RAISE NOTICE '   You can now:';
  RAISE NOTICE '   1. Answer practice questions incorrectly';
  RAISE NOTICE '   2. They will be saved to incorrect_questions';
  RAISE NOTICE '   3. Review them in the Review Incorrect Questions tab';
END $$;

