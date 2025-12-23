# AI Study Planner Database Setup

此README说明如何为AI Study Planner功能设置数据库表。

## 📋 概览

这个数据库设置包含以下新功能：
- **Practice Questions**: 学生可以练习HSC科目相关题目
- **Incorrect Questions**: 自动记录和复习错题
- **Study Plans**: HSC学习计划管理
- **AI Recommendations**: AI驱动的学习建议
- **HSC Subjects**: 完整的HSC科目数据库

## 🚀 快速开始

### 步骤1: 运行主表创建脚本

在Supabase SQL Editor中运行：

```sql
-- 创建所有AI Study Planner相关的表
\i study_planner_tables.sql
```

或者在Supabase Dashboard:
1. 进入 SQL Editor
2. 粘贴 `study_planner_tables.sql` 的全部内容
3. 点击 "Run"

### 步骤2: 插入示例数据 (可选)

如果需要示例数据进行测试：

```sql
-- 插入示例HSC科目、练习题目和选项
\i study_planner_sample_data.sql
```

### 步骤3: 验证安装

检查表是否成功创建：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%practice%' 
     OR table_name LIKE '%incorrect%'
     OR table_name LIKE '%study_plan%'
     OR table_name LIKE '%hsc_subject%'
ORDER BY table_name;
```

你应该看到：
- `hsc_subjects`
- `study_plans`
- `practice_question_sets`
- `practice_questions`
- `practice_question_options`
- `practice_attempts`
- `practice_attempt_answers`
- `incorrect_questions`
- `study_recommendations`

## 📊 数据库架构

### 核心表关系图

```
hsc_subjects (科目信息)
    ↓
study_plans (学习计划)
    ↓ references hsc_subjects[]

practice_question_sets (练习集)
    ↓ has many
practice_questions (题目)
    ↓ has many
practice_question_options (选项)

practice_attempts (练习记录)
    ↓ has many
practice_attempt_answers (答案记录)
    ↓ references practice_questions

incorrect_questions (错题集)
    ↑ 从practice自动生成

study_recommendations (AI建议)
```

## 🔐 权限和安全

所有表都启用了**Row Level Security (RLS)**，确保：
- 学生只能访问自己的数据
- 家长可以看到他们子女的数据
- 管理员有完全访问权限

### 关键权限规则

1. **学生权限**:
   - 可以查看所有HSC科目和练习题目
   - 可以创建和管理自己的学习计划
   - 可以提交练习答案
   - 可以查看和更新自己的错题集

2. **家长权限**:
   - 可以查看子女的学习计划和练习记录
   - 可以查看子女的错题集和成绩

3. **管理员权限**:
   - 可以管理所有HSC科目
   - 可以创建和修改练习题目
   - 可以查看所有学生数据

## 🛠️ 辅助函数

数据库提供了以下辅助函数：

### 1. `get_questions_due_for_review(student_id)`
获取需要复习的错题（使用间隔重复算法）

```sql
SELECT * FROM public.get_questions_due_for_review('student-uuid-here');
```

### 2. `update_question_review(question_id, is_correct, student_id)`
更新错题复习状态

```sql
SELECT public.update_question_review('question-uuid', true, 'student-uuid');
```

### 3. `get_practice_stats(student_id)`
获取学生练习统计

```sql
SELECT * FROM public.get_practice_stats('student-uuid-here');
```

返回：
- total_attempts: 总练习次数
- total_questions_answered: 总答题数
- total_correct: 正确题数
- average_score: 平均分
- subjects_practiced: 练习过的科目
- improvement_trend: 进步趋势

## 📝 使用示例

### 创建学习计划

```sql
INSERT INTO public.study_plans (student_id, plan_name, subjects, total_units)
VALUES (
  'student-uuid',
  'My HSC Plan',
  '[
    {"id": 1, "name": "Mathematics Advanced", "units": 2},
    {"id": 2, "name": "English Advanced", "units": 2}
  ]'::jsonb,
  4
);
```

### 记录练习尝试

```sql
-- 1. 创建尝试记录
INSERT INTO public.practice_attempts (student_id, set_id, score_correct, score_total, score_percentage)
VALUES ('student-uuid', 'set-uuid', 8, 10, 80.0)
RETURNING id;

-- 2. 记录每个答案
INSERT INTO public.practice_attempt_answers (attempt_id, question_id, selected_option_id, is_correct)
VALUES 
  ('attempt-uuid', 'question-1-uuid', 'a', true),
  ('attempt-uuid', 'question-2-uuid', 'b', false);
```

### 添加错题

```sql
INSERT INTO public.incorrect_questions (
  student_id, question_text, correct_answer, student_answer, 
  explanation, topic, subject, difficulty, assignment_source
)
VALUES (
  'student-uuid',
  'What is the derivative of x²?',
  '2x',
  'x',
  'Using the power rule: d/dx(x²) = 2x',
  'Calculus',
  'Mathematics Advanced',
  'Medium',
  'Practice: Calculus'
);
```

## 🔄 与前端集成

### API端点需求

后端需要创建以下REST API端点：

#### Practice Questions
- `GET /api/practice/sets` - 获取所有练习集
- `GET /api/practice/sets/:id/questions` - 获取练习集的题目
- `POST /api/practice/attempts` - 提交练习尝试
- `GET /api/practice/stats` - 获取练习统计

#### Incorrect Questions  
- `GET /api/review/questions` - 获取需要复习的错题
- `PUT /api/review/questions/:id` - 更新错题复习状态
- `GET /api/review/stats` - 获取错题统计

#### Study Plans
- `GET /api/study-plan` - 获取学生学习计划
- `PUT /api/study-plan` - 更新学习计划
- `GET /api/subjects` - 获取所有HSC科目

## ⚠️ 注意事项

1. **顺序很重要**: 必须按顺序运行SQL脚本
   - 先运行 `init.sql` (如果还没有)
   - 再运行 `study_planner_tables.sql`
   - 最后运行 `study_planner_sample_data.sql`

2. **RLS策略**: 所有表都已启用RLS，确保数据安全

3. **索引**: 已为常用查询添加索引，优化性能

4. **外键约束**: 使用 `ON DELETE CASCADE` 确保数据一致性

5. **UUID**: 所有表使用UUID作为主键

## 🐛 故障排除

### 问题: "relation does not exist"
**解决**: 确保先运行了 `init.sql` 创建profiles表

### 问题: "permission denied"
**解决**: 检查RLS策略是否正确设置，确保以认证用户身份查询

### 问题: "foreign key violation"
**解决**: 确保引用的记录存在（如practice_questions必须有有效的set_id）

## 📚 更多信息

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)

## 🤝 贡献

如果需要添加更多HSC科目或练习题目，请：
1. 更新 `study_planner_sample_data.sql`
2. 确保所有题目有4个选项且只有1个正确答案
3. 添加必要的解释

