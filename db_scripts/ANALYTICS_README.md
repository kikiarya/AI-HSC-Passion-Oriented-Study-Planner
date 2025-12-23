# Analytics 页面数据填充指南

## 问题说明

教师端的 Analytics 页面目前显示的都是 "No data yet" 或 "N/A"，需要从数据库生成示例数据并接入页面。

## 解决方案

已完成以下工作：

1. **SQL 脚本生成示例数据**：`populate_analytics_data.sql`
2. **后端 API 端点**：`GET /api/teacher/analytics`
3. **前端组件更新**：自动调用 API 并显示数据

## 使用步骤

### 1. 在 Supabase SQL Editor 中运行脚本

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor** (左侧边栏)
3. 点击 **New Query**
4. 打开 `db_scripts/populate_analytics_data.sql` 文件
5. 复制整个文件内容并粘贴到 SQL Editor
6. 点击 **Run** 执行脚本

### 2. 验证数据生成

脚本执行后会显示：
- 总 assignments 数量
- 总 submissions 数量
- 各班级的统计数据（assignments, students, submissions, avg grade）

### 3. 刷新前端页面

运行脚本后：
1. **重启后端服务器**（如果正在运行）
2. 刷新浏览器页面
3. 进入 Analytics 页面
4. 现在应该显示：
   - **Total Students**: 实际学生数量
   - **Average Grade**: 平均分数（如 "75%"）
   - **Assignment Completion**: 完成率（如 "70%"）
   - **Attendance Rate**: 出勤率（如 "92%"）

### 4. 测试班级筛选

1. 在 "Select Class" 下拉菜单中选择不同班级
2. 统计数据会相应更新
3. 选择 "All Classes" 显示所有班级的总体统计

## 脚本功能说明

### Step 1: 创建示例作业
- 为每个有学生的班级创建 3-6 个作业
- 作业类型包括：homework, quiz, exam
- 作业创建时间分布在过去 30 天内

### Step 2: 创建提交记录
- 70% 的学生会提交每个作业
- 提交时间分布在过去 20 天内
- 包含按时提交和延迟提交

### Step 3: 评分
- 80% 的提交会被评分
- 成绩分布：
  - 10% 获得 A (90-100)
  - 20% 获得 B (80-89)
  - 30% 获得 C (70-79)
  - 25% 获得 D (60-69)
  - 15% 获得 F (40-59)

### Step 4-5: 验证结果
- 显示统计数据
- 按班级分组显示示例数据

## 后端 API

### GET /api/teacher/analytics

获取总体统计数据。

**Query Parameters:**
- `classId` (可选): 特定班级 ID，默认 'all' 表示所有班级

**Response:**
```json
{
  "totalStudents": 25,
  "averageGrade": "75%",
  "assignmentCompletion": "70%",
  "attendanceRate": "92%",
  "totalAssignments": 12,
  "totalSubmissions": 210,
  "gradedSubmissions": 168
}
```

## 前端功能

### AnalyticsView 组件
- 自动获取统计数据
- 支持按班级筛选
- 实时更新统计数据
- 显示 AI Insights（如果生成）

### 统计数据卡片
1. **Total Students**: 显示注册学生总数
2. **Average Grade**: 显示平均分数（基于已评分的提交）
3. **Assignment Completion**: 显示作业完成率
4. **Attendance Rate**: 显示出勤率（目前为占位数据）

## 注意事项

1. **Attendance Rate**: 目前是占位数据（85-100%），实际出勤率需要实现 attendance tracking 表
2. **数据分布**: 脚本使用随机数生成数据，每次运行结果可能不同
3. **性能**: 如果有大量班级和学生，脚本可能需要几分钟运行
4. **覆盖**: 脚本使用 `ON CONFLICT DO NOTHING`，不会覆盖现有数据

## 故障排除

### 如果统计数据仍显示 0 或 N/A：

1. **检查数据库**：在 Supabase SQL Editor 中查询：
   ```sql
   SELECT 
     COUNT(*) as assignments,
     (SELECT COUNT(*) FROM assignment_submissions) as submissions,
     (SELECT COUNT(*) FROM assignment_submissions WHERE grade IS NOT NULL) as graded
   FROM assignments;
   ```

2. **检查后端日志**：查看后端控制台是否有错误

3. **检查网络请求**：在浏览器开发者工具的 Network 标签页中，查看 `/api/teacher/analytics` 请求是否成功

4. **验证权限**：确保教师用户有访问这些班级的权限

## 下一步

如果需要实现真实的出勤率跟踪：

1. 创建 `attendance` 表
2. 添加出勤记录
3. 更新后端 API 计算真实的出勤率

## 预期结果

运行脚本后：
- ✅ Analytics 页面显示真实数据
- ✅ 统计数据随班级选择动态更新
- ✅ 平均分数、完成率等指标正常显示
- ✅ 不再显示 "No data yet" 或 "N/A"

