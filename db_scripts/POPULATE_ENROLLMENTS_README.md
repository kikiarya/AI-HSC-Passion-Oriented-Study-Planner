# 填充 Enrollments 表日期数据

## 问题说明

当前 Students 页面显示所有学生的 "Enrolled" 日期都是 "2025/11/1"，这是因为数据库中的 `enrollments.enrolled_at` 字段可能为 NULL 或所有记录都有相同的默认值。

## 解决方案

运行 `populate_enrollments_dates.sql` 脚本来：
1. 确保 `enrollments.enrolled_at` 列存在
2. 为所有现有的 enrollments 记录填充合理的注册日期
3. 根据学生的创建日期生成不同的注册日期，而不是使用同一个日期

## 使用步骤

### 1. 在 Supabase SQL Editor 中运行脚本

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor** (左侧边栏)
3. 点击 **New Query**
4. 打开 `db_scripts/populate_enrollments_dates.sql` 文件
5. 复制整个文件内容并粘贴到 SQL Editor
6. 点击 **Run** 执行脚本

### 2. 查看执行结果

脚本执行后会显示：
- 总注册记录数
- 唯一学生数
- 唯一班级数
- 最早和最晚的注册日期
- 仍然为 NULL 的日期数量
- 示例学生及其注册日期

### 3. 验证数据

执行以下查询来验证数据：

```sql
-- 查看所有 enrollments 及其日期
SELECT 
  p.email,
  c.name as class_name,
  e.enrolled_at,
  e.created_at,
  p.created_at as profile_created
FROM public.enrollments e
JOIN public.profiles p ON p.id = e.student_id
JOIN public.classes c ON c.id = e.class_id
ORDER BY e.enrolled_at DESC
LIMIT 20;
```

### 4. 刷新前端页面

运行脚本后：
1. 刷新浏览器页面
2. Students 页面应该显示不同的注册日期
3. 每个学生的日期应该基于他们的账户创建时间或实际的注册日期

## 脚本功能说明

### Step 1: 确保 enrolled_at 列存在
如果 `enrollments` 表没有 `enrolled_at` 列，会自动创建。

### Step 2: 更新 NULL 日期
将所有 `enrolled_at` 为 NULL 的记录更新为：
- 优先使用 enrollment 的 `created_at`
- 其次使用学生 profile 的 `created_at`
- 再次使用班级的 `created_at`
- 最后使用当前时间

### Step 3: 统计信息
显示当前的注册记录统计。

### Step 4: 可选 - 创建新注册记录
（已注释）如果需要为没有注册记录的学生创建注册，可以取消注释这部分代码。

### Step 5: 分配不同的日期
如果所有记录的日期都相同（可能是默认值），脚本会根据学生的创建时间分配不同的日期：
- 如果学生账户创建于 6 个月前：注册日期在账户创建后的 30 天内
- 如果学生账户是最近创建的：注册日期在账户创建后的 10 天内

### Step 6 & 7: 验证结果
显示最终的统计信息和示例数据。

## 注意事项

1. **备份数据**：运行脚本前建议备份数据库
2. **RLS 策略**：确保有足够的权限执行 UPDATE 操作
3. **时间范围**：脚本生成的日期是基于学生账户的创建时间，这样更符合实际情况
4. **不重复**：脚本使用 `COALESCE` 和条件检查，避免重复更新

## 预期结果

运行脚本后：
- ✅ 所有 enrollments 记录都有 `enrolled_at` 值
- ✅ 不同学生的注册日期不同
- ✅ 注册日期在合理的时间范围内（通常在账户创建后的 30 天内）
- ✅ 前端 Students 页面显示正确的注册日期，而不是统一的 "2025/11/1"

## 故障排除

如果执行后仍然显示相同的日期：

1. **检查数据库**：直接在 Supabase SQL Editor 中查询：
   ```sql
   SELECT enrolled_at, COUNT(*) 
   FROM public.enrollments 
   GROUP BY enrolled_at 
   ORDER BY COUNT(*) DESC;
   ```

2. **检查后端日志**：查看后端控制台的调试输出，确认返回的数据

3. **清除缓存**：清除浏览器缓存并刷新页面

4. **重启后端**：重启后端服务器以确保代码更改生效

