# 填充 Assignments 数据脚本说明

## 目的
此脚本为现有的课程（classes）生成真实的作业（assignments）数据，用于测试和演示。

## 功能特点

### 1. 自动生成作业
- 为每个有学生注册的课程创建 **3-5 个作业**
- 基于课程代码自动生成相关主题的作业标题
- 根据科目类型生成相应的作业描述

### 2. 作业属性
- **标题**：根据科目类型自动生成（如数学、物理、化学、英语、工程）
- **描述**：针对不同科目的定制化描述
- **截止日期**：混合过去、现在和未来的日期
- **总分**：随机分配 50、100 或 150 分
- **状态**：已发布（published）或草稿（draft）
- **创建人**：自动关联课程教师

### 3. 科目特定内容

#### 数学 (MATH)
- Calculus Problem Set
- Functions and Graphs Quiz
- Trigonometry Assignment
- Probability and Statistics Project

#### 物理 (PHYS)
- Mechanics Problem Set
- Waves and Optics Lab Report
- Electricity and Magnetism Quiz
- Modern Physics Assignment

#### 化学 (CHEM)
- Organic Chemistry Problem Set
- Acid-Base Equilibria Quiz
- Electrochemistry Lab Report
- Chemical Kinetics Assignment

#### 英语 (ENGL)
- Essay: Text Analysis / Creative Writing / Literary Response
- Reading Comprehension Quiz
- Poetry Analysis Project
- Oral Presentation Preparation

#### 工程 (ELEC)
- Power Systems Analysis Problem Set
- Load Flow Analysis Project
- Fault Analysis Quiz
- Protection Systems Assignment

## 使用方法

### 方法 1: 通过 Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard
2. 导航到 **SQL Editor**（左侧边栏）
3. 点击 **New Query**
4. 复制并粘贴 `populate_assignments.sql` 的全部内容
5. 点击 **Run** 执行脚本

### 方法 2: 通过 Supabase CLI

```bash
# 如果有 Supabase CLI
supabase db push
```

### 方法 3: 直接 SQL 执行

如果有直接数据库访问权限：

```bash
psql -h your-database-host -U postgres -d postgres -f db_scripts/populate_assignments.sql
```

## 验证数据

执行脚本后，运行以下查询验证数据：

### 1. 检查作业数量

```sql
SELECT 
  c.code AS class_code,
  c.name AS class_name,
  COUNT(a.id) AS assignment_count,
  COUNT(CASE WHEN a.status = 'published' THEN 1 END) AS published_count,
  COUNT(CASE WHEN a.status = 'draft' THEN 1 END) AS draft_count
FROM public.classes c
LEFT JOIN public.assignments a ON a.class_id = c.id
GROUP BY c.id, c.code, c.name
ORDER BY c.code;
```

### 2. 检查作业详情

```sql
SELECT 
  a.id,
  a.title,
  a.status,
  a.total_points,
  a.due_date,
  c.code AS class_code,
  c.name AS class_name
FROM public.assignments a
JOIN public.classes c ON c.id = a.class_id
ORDER BY c.code, a.due_date;
```

### 3. 检查作业截止日期分布

```sql
SELECT 
  CASE 
    WHEN due_date < NOW() THEN 'Past'
    WHEN due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN 'This Week'
    WHEN due_date BETWEEN NOW() + INTERVAL '7 days' AND NOW() + INTERVAL '30 days' THEN 'This Month'
    ELSE 'Future'
  END AS due_category,
  COUNT(*) AS assignment_count
FROM public.assignments
GROUP BY due_category
ORDER BY 
  CASE due_category
    WHEN 'Past' THEN 1
    WHEN 'This Week' THEN 2
    WHEN 'This Month' THEN 3
    ELSE 4
  END;
```

## 注意事项

1. **前置条件**：
   - 确保已经有课程（classes）数据（参考 `sample_classes.sql`）
   - 确保课程有教师关联（class_teachers 表）
   - 确保课程有学生注册（enrollments 表）

2. **数据安全**：
   - 脚本使用 `WHERE NOT EXISTS` 避免重复插入
   - 但在重新运行时会创建新的作业（不是更新现有作业）

3. **字段说明**：
   - `instructions`、`rubric`、`questions`、`resources` 设置为空数组（JSONB）
   - 这些字段可以在后续通过 API 或界面填充

## 故障排除

### 问题：没有创建作业
- **原因**：课程没有关联的教师
- **解决**：确保 `class_teachers` 表中有数据

### 问题：作业状态不正确
- **原因**：`status` 字段必须是 'draft' 或 'published'
- **解决**：检查数据库中是否有 `assignment_status` enum 类型，如果没有，可能需要使用 TEXT 类型

### 问题：截止日期为空
- **原因**：计算日期时出错
- **解决**：检查 `due_date` 字段的数据类型

## 后续步骤

生成作业后，你可以：
1. 通过教师门户创建更多作业
2. 为学生创建作业提交（submissions）
3. 为提交评分（grading）
4. 查看分析数据（analytics）

