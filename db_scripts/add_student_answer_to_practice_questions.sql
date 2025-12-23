-- ==========================================
-- 添加 student_answer 字段到 practice_questions 表
-- 用于存储学生的答案以便在错题复习时显示
-- ==========================================

-- 添加 student_answer 字段
ALTER TABLE practice_questions 
ADD COLUMN IF NOT EXISTS student_answer TEXT;

-- 添加注释
COMMENT ON COLUMN practice_questions.student_answer IS '学生提交的答案';

-- 验证字段已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'practice_questions' 
  AND column_name = 'student_answer';

-- 成功消息
DO $$ 
BEGIN
  RAISE NOTICE '✅ student_answer column added to practice_questions table!';
  RAISE NOTICE 'This column will store student answers for review purposes.';
END $$;

