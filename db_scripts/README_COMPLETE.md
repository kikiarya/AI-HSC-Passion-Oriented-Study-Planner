# 数据库完整设置指南

## 概述

本指南提供了为HSC Power平台设置完整数据库的步骤。

## 数据库架构

数据库分为三个主要部分：

### 1. 核心教学系统
- **profiles**: 用户档案
- **profile_roles**: 用户角色（student, teacher, parent, admin）
- **classes**: 课程信息
- **class_teachers**: 教师-课程关联
- **enrollments**: 学生注册
- **assignments**: 作业
- **assignment_submissions**: 作业提交
- **class_materials**: 课程材料
- **class_schedule_sessions**: 课程时间表
- **class_announcements**: 公告

### 2. AI Study Planner系统
- **hsc_subjects**: HSC科目信息
- **study_plans**: 学生学习计划
- **practice_question_sets**: 练习题集
- **practice_questions**: 练习题目
- **practice_question_options**: 题目选项
- **practice_attempts**: 练习尝试记录
- **practice_attempt_answers**: 练习答案
- **incorrect_questions**: 错题记录
- **study_recommendations**: AI学习推荐

## 部署步骤

### 步骤1: 运行核心数据库脚本

在Supabase SQL Editor中按以下顺序运行：

```bash
# 1. 初始化角色和权限
-- 运行: init.sql
-- 这个文件创建了用户角色系统和所有必需的表

# 2. 设置RLS策略
-- 运行: policies.sql
-- 这个文件启用了行级安全策略并定义了访问权限
```

**重要**: `init.sql`和`policies.sql`必须在所有其他脚本之前运行。

### 步骤2: 运行AI Study Planner脚本

```bash
# 3. 创建AI Study Planner表
-- 运行: study_planner_tables.sql
-- 这个文件创建了AI Study Planner相关的所有表

# 4. 插入示例数据（可选）
-- 运行: study_planner_sample_data.sql
-- 这个文件插入了一些示例HSC科目和练习题
```

### 步骤3: 验证设置

运行以下查询验证所有表都已创建：

```sql
-- 检查所有表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 检查RLS是否已启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 检查关键表的数据
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM classes;
SELECT COUNT(*) FROM hsc_subjects;
```

## API端点验证

设置完成后，可以通过以下API端点验证：

### 身份验证端点
```bash
POST /api/auth/login
POST /api/auth/signup
```

### 学生端点
```bash
GET /api/student/classes
GET /api/student/assignments
GET /api/student/subjects
GET /api/student/study-planner
```

### 教师端点
```bash
GET /api/teacher/classes
GET /api/teacher/assignments
GET /api/teacher/students
GET /api/teacher/announcements
```

### AI功能端点
```bash
POST /api/student/ai/study-plan
POST /api/teacher/ai/auto-grade
POST /api/teacher/ai/generate-rubric
```

## 故障排除

### 问题1: RLS策略错误

如果遇到权限错误，检查：
```sql
-- 查看当前用户角色
SELECT pr.role 
FROM profile_roles pr 
WHERE pr.profile_id = auth.uid();

-- 检查RLS策略
SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
```

### 问题2: 外键约束错误

如果遇到外键错误，确保：
1. 相关表已创建
2. 插入的顺序正确（先插入父表）
3. 使用了正确的UUID格式

### 问题3: 函数不存在

如果看到函数不存在错误：
```sql
-- 检查函数是否存在
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION';
```

确保`init.sql`中的所有函数都已成功创建。

## 数据备份和迁移

### 备份当前数据库
```bash
# 使用Supabase Dashboard备份
# 或者使用pg_dump命令
pg_dump -h your-supabase-host -U postgres -d postgres > backup.sql
```

### 恢复数据库
```bash
# 使用Supabase Dashboard恢复
# 或者使用psql命令
psql -h your-supabase-host -U postgres -d postgres < backup.sql
```

## 下一步

完成数据库设置后：

1. **配置环境变量**: 确保后端正确配置了Supabase连接
2. **启动后端服务器**: `cd backend && npm start`
3. **启动前端服务器**: `cd frontend && npm run dev`
4. **测试API端点**: 使用Postman或curl测试各个端点
5. **创建测试账户**: 
   - 创建一个学生账户
   - 创建一个教师账户
   - 测试登录和基本功能

## 支持

如果遇到问题：
1. 检查Supabase控制台的错误日志
2. 查看浏览器控制台的网络请求
3. 查看后端服务器的日志
4. 参考各个SQL文件的注释

## 版本信息

- **数据库版本**: PostgreSQL 14+
- **Supabase版本**: Latest
- **最后更新**: 2025年1月
- **维护者**: ELEC5620 Group 83

