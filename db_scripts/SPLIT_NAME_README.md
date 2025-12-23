# 拆分 name 字段到 first_name 和 last_name

## 问题说明

学生详情页面显示 "Name: N/A"，这是因为数据库中的 `profiles` 表的 `first_name` 和 `last_name` 字段可能为空，而完整的名字存储在 `name` 字段中。

## 解决方案

有两种方法解决这个问题：

### 方法 1：运行 SQL 脚本拆分 name 字段（推荐）

运行 `split_name_to_first_last.sql` 脚本，将 `name` 字段的内容拆分并填充到 `first_name` 和 `last_name` 字段中。

### 方法 2：后端自动处理（已实现）

后端代码已更新，会自动从 `name` 字段提取 `first_name` 和 `last_name`。但如果数据库中有数据，建议先运行 SQL 脚本来规范数据。

## 使用步骤

### 1. 在 Supabase SQL Editor 中运行脚本

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor** (左侧边栏)
3. 点击 **New Query**
4. 打开 `db_scripts/split_name_to_first_last.sql` 文件
5. 复制整个文件内容并粘贴到 SQL Editor
6. 点击 **Run** 执行脚本

### 2. 查看执行结果

脚本执行后会显示：
- 总 profiles 记录数
- 有 first_name 的记录数
- 有 last_name 的记录数
- 没有名字的记录数
- 示例数据（显示原始 name 和拆分后的 first_name/last_name）
- 仍然需要处理的记录

### 3. 验证数据

执行以下查询来验证数据：

```sql
-- 查看学生的名字信息
SELECT 
  email,
  name as original_name,
  first_name,
  last_name,
  CASE 
    WHEN first_name IS NOT NULL AND first_name != '' THEN 
      CONCAT(first_name, COALESCE(' ' || NULLIF(last_name, ''), ''))
    ELSE 
      name 
  END as display_name
FROM public.profiles
WHERE EXISTS (
  SELECT 1 FROM public.profile_roles pr 
  WHERE pr.profile_id = profiles.id 
    AND pr.role = 'student'
)
ORDER BY email
LIMIT 20;
```

### 4. 刷新前端页面

运行脚本后：
1. 刷新浏览器页面
2. 点击学生的 "View Details" 按钮
3. 现在应该显示正确的名字，而不是 "N/A"

## 脚本功能说明

### Step 1: 确保列存在
如果 `profiles` 表没有 `first_name` 和 `last_name` 列，会自动创建。

### Step 2: 拆分 name 字段
- 如果 `name` 包含空格：第一个词作为 `first_name`，剩余部分作为 `last_name`
- 如果 `name` 不包含空格：整个 `name` 作为 `first_name`，`last_name` 为空
- 只更新 `first_name` 和 `last_name` 为空的记录

### Step 3: 处理邮箱格式的 name
如果 `name` 字段和 `email` 字段相同（可能是注册时没有提供名字），尝试从邮箱地址中提取用户名部分。

### Step 4-6: 验证结果
显示统计信息和示例数据，帮助确认拆分是否正确。

## 后端自动处理

即使不运行 SQL 脚本，后端代码也会自动处理：

1. **获取学生列表时**：如果 `first_name` 和 `last_name` 为空，会自动从 `name` 字段提取
2. **获取学生详情时**：同样会自动处理 `name` 字段

但为了数据库的一致性和长期维护，建议运行 SQL 脚本来规范数据。

## 注意事项

1. **备份数据**：运行脚本前建议备份数据库
2. **数据格式**：脚本假设 `name` 字段的格式是 "First Last" 或 "First"
3. **不会覆盖已有数据**：只会更新 `first_name` 和 `last_name` 为空的记录
4. **多词名字**：如果名字有多个词（如 "John Michael Smith"），第一个词是 `first_name`，其余是 `last_name`

## 预期结果

运行脚本后：
- ✅ 所有学生的 `first_name` 和 `last_name` 字段都有值
- ✅ 前端显示正确的名字，而不是 "N/A"
- ✅ 学生详情页面显示完整的姓名

## 故障排除

如果执行后仍然显示 "N/A"：

1. **检查数据**：直接在 Supabase SQL Editor 中查询：
   ```sql
   SELECT email, name, first_name, last_name 
   FROM public.profiles 
   WHERE EXISTS (
     SELECT 1 FROM public.profile_roles pr 
     WHERE pr.profile_id = profiles.id 
       AND pr.role = 'student'
   )
   LIMIT 10;
   ```

2. **检查后端日志**：查看后端控制台的调试输出

3. **清除缓存**：清除浏览器缓存并刷新页面

4. **重启后端**：重启后端服务器以确保代码更改生效

