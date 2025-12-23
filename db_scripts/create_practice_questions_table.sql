-- ==========================================
-- 创建独立的练习题表
-- 专门用于存储AI生成的个人练习题
-- ==========================================

-- 1. 主表：练习题集
CREATE TABLE IF NOT EXISTS practice_question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 练习题表
CREATE TABLE IF NOT EXISTS practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES practice_question_sets(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 题目内容
  position INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('multiple_choice', 'short_answer', 'text', 'true_false')),
  question TEXT NOT NULL,
  points INTEGER DEFAULT 10,
  
  -- 科目标注（重要！）
  subject TEXT NOT NULL,
  subject_code VARCHAR(50),
  
  -- 答案相关
  correct_answer TEXT,
  explanation TEXT,
  
  -- 学习追踪
  attempted BOOLEAN DEFAULT FALSE,
  correct BOOLEAN DEFAULT NULL,
  attempt_count INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 多选题选项表
CREATE TABLE IF NOT EXISTS practice_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES practice_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 索引优化
-- ==========================================

-- practice_question_sets 索引
CREATE INDEX IF NOT EXISTS idx_practice_sets_student ON practice_question_sets(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_sets_created ON practice_question_sets(created_at DESC);

-- practice_questions 索引
CREATE INDEX IF NOT EXISTS idx_practice_questions_set ON practice_questions(set_id);
CREATE INDEX IF NOT EXISTS idx_practice_questions_student ON practice_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_practice_questions_subject ON practice_questions(subject);
CREATE INDEX IF NOT EXISTS idx_practice_questions_subject_code ON practice_questions(subject_code);
CREATE INDEX IF NOT EXISTS idx_practice_questions_type ON practice_questions(type);

-- practice_question_options 索引
CREATE INDEX IF NOT EXISTS idx_practice_options_question ON practice_question_options(question_id);

-- ==========================================
-- 触发器：自动更新 updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_practice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为每个表添加触发器
DROP TRIGGER IF EXISTS practice_sets_updated_at ON practice_question_sets;
CREATE TRIGGER practice_sets_updated_at
  BEFORE UPDATE ON practice_question_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_updated_at();

DROP TRIGGER IF EXISTS practice_questions_updated_at ON practice_questions;
CREATE TRIGGER practice_questions_updated_at
  BEFORE UPDATE ON practice_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_practice_updated_at();

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- 启用 RLS
ALTER TABLE practice_question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_question_options ENABLE ROW LEVEL SECURITY;

-- practice_question_sets 策略
DROP POLICY IF EXISTS "students_own_practice_sets" ON practice_question_sets;
CREATE POLICY "students_own_practice_sets"
  ON practice_question_sets
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- practice_questions 策略
DROP POLICY IF EXISTS "students_own_practice_questions" ON practice_questions;
CREATE POLICY "students_own_practice_questions"
  ON practice_questions
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- practice_question_options 策略
DROP POLICY IF EXISTS "students_own_practice_options" ON practice_question_options;
CREATE POLICY "students_own_practice_options"
  ON practice_question_options
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM practice_questions pq
      WHERE pq.id = practice_question_options.question_id
        AND pq.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM practice_questions pq
      WHERE pq.id = practice_question_options.question_id
        AND pq.student_id = auth.uid()
    )
  );

-- ==========================================
-- 授予权限
-- ==========================================

GRANT ALL ON practice_question_sets TO authenticated;
GRANT ALL ON practice_questions TO authenticated;
GRANT ALL ON practice_question_options TO authenticated;

-- ==========================================
-- 注释
-- ==========================================

COMMENT ON TABLE practice_question_sets IS '练习题集：每次生成AI练习题时创建一个集合';
COMMENT ON TABLE practice_questions IS 'AI生成的练习题，按科目标注';
COMMENT ON TABLE practice_question_options IS '多选题的选项';

COMMENT ON COLUMN practice_questions.subject IS '科目名称，例如：Mathematics Advanced';
COMMENT ON COLUMN practice_questions.subject_code IS '科目代码，例如：MATH-ADV';
COMMENT ON COLUMN practice_questions.attempt_count IS '学生尝试次数';
COMMENT ON COLUMN practice_questions.correct IS '最后一次尝试是否正确';

-- ==========================================
-- 验证
-- ==========================================

-- 检查表是否创建成功
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE 'practice_%'
ORDER BY table_name;

-- 检查 RLS 是否启用
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'practice_%';

-- 检查策略
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename LIKE 'practice_%'
ORDER BY tablename, policyname;

-- 成功消息
DO $$ 
BEGIN
  RAISE NOTICE '✅ Practice questions tables created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '   Tables created:';
  RAISE NOTICE '   - practice_question_sets (题集)';
  RAISE NOTICE '   - practice_questions (题目，带科目标注)';
  RAISE NOTICE '   - practice_question_options (选项)';
  RAISE NOTICE '';
  RAISE NOTICE '   Features:';
  RAISE NOTICE '   - RLS enabled for data security';
  RAISE NOTICE '   - Indexes for performance';
  RAISE NOTICE '   - Auto-update timestamps';
  RAISE NOTICE '   - Subject tagging support';
END $$;

