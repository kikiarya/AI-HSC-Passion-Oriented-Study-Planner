import dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 诊断数据库连接问题\n');
console.log('='.repeat(70));

// 1. 检查 .env 文件
const envPath = join(__dirname, '.env');
console.log('\n1️⃣ 检查 .env 文件...');
console.log('   路径:', envPath);

if (existsSync(envPath)) {
  console.log('   ✅ .env 文件存在');
  
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
    
    console.log('\n   .env 文件内容:');
    lines.forEach(line => {
      const [key] = line.split('=');
      if (key) {
        const value = line.substring(key.length + 1);
        if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
          console.log(`   ${key}=${value.substring(0, 20)}... (已隐藏)`);
        } else {
          console.log(`   ${key}=${value}`);
        }
      }
    });
    
    // 检查必要的变量
    const hasUrl = envContent.includes('SUPABASE_URL');
    const hasKey = envContent.includes('SUPABASE_KEY');
    
    console.log('\n   变量检查:');
    console.log('   SUPABASE_URL:', hasUrl ? '✅ 存在' : '❌ 不存在');
    console.log('   SUPABASE_KEY:', hasKey ? '✅ 存在' : '❌ 不存在');
    
  } catch (err) {
    console.log('   ❌ 无法读取 .env 文件:', err.message);
  }
} else {
  console.log('   ❌ .env 文件不存在!');
  console.log('   请创建 backend/.env 文件');
  process.exit(1);
}

// 2. 加载环境变量
console.log('\n2️⃣ 加载环境变量...');
try {
  dotenv.config({ path: envPath });
  console.log('   ✅ 环境变量已加载');
} catch (err) {
  console.log('   ❌ 加载失败:', err.message);
  process.exit(1);
}

// 3. 检查环境变量值
console.log('\n3️⃣ 检查环境变量值...');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  console.log('   ❌ SUPABASE_URL 未设置');
  console.log('   请在 .env 文件中添加: SUPABASE_URL=https://xxx.supabase.co');
} else {
  console.log('   ✅ SUPABASE_URL:', supabaseUrl);
  
  // 验证 URL 格式
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.log('   ⚠️  警告: URL 格式可能不正确');
  }
}

if (!supabaseKey) {
  console.log('   ❌ SUPABASE_KEY 未设置');
  console.log('   请在 .env 文件中添加: SUPABASE_KEY=your-key-here');
  process.exit(1);
} else {
  console.log('   ✅ SUPABASE_KEY:', supabaseKey.substring(0, 30) + '...');
  
  // 检查 key 类型
  try {
    const parts = supabaseKey.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('   Key role:', payload.role || 'unknown');
      
      if (payload.role === 'anon') {
        console.log('   ❌ 错误: 使用了 ANON key，应该使用 SERVICE_ROLE key');
        console.log('   获取方法: Supabase Dashboard → Settings → API → service_role');
      } else if (payload.role === 'service_role') {
        console.log('   ✅ 使用了正确的 service_role key');
      }
    }
  } catch (e) {
    console.log('   ⚠️  无法解析 key:', e.message);
  }
}

// 4. 测试 Supabase 客户端初始化
console.log('\n4️⃣ 测试 Supabase 客户端初始化...');
try {
  const { createClient } = await import('@supabase/supabase-js');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('   ❌ 无法创建客户端: 缺少必要的环境变量');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
  
  console.log('   ✅ Supabase 客户端创建成功');
  
  // 5. 测试数据库连接
  console.log('\n5️⃣ 测试数据库连接...');
  
  // 测试 1: 查询 profiles 表
  console.log('   测试 profiles 表...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  
  if (profilesError) {
    console.log('   ❌ profiles 表查询失败:');
    console.log('      错误信息:', profilesError.message);
    console.log('      错误代码:', profilesError.code);
    console.log('      错误详情:', profilesError.details);
    console.log('      错误提示:', profilesError.hint);
    
    if (profilesError.code === 'PGRST116' || profilesError.message.includes('does not exist')) {
      console.log('\n   💡 提示: 表可能不存在，需要运行数据库初始化脚本');
      console.log('      运行: db_scripts/init.sql 在 Supabase SQL Editor 中');
    }
    
    if (profilesError.message.includes('row-level security') || profilesError.message.includes('RLS')) {
      console.log('\n   💡 提示: RLS 策略问题，但使用 service_role key 应该绕过 RLS');
      console.log('      请确认使用的是 service_role key，不是 anon key');
    }
  } else {
    console.log('   ✅ profiles 表查询成功');
    console.log('      返回数据:', profiles);
  }
  
  // 测试 2: 查询 profile_roles 表
  console.log('\n   测试 profile_roles 表...');
  const { data: roles, error: rolesError } = await supabase
    .from('profile_roles')
    .select('profile_id, role')
    .limit(5);
  
  if (rolesError) {
    console.log('   ❌ profile_roles 表查询失败:');
    console.log('      错误信息:', rolesError.message);
    console.log('      错误代码:', rolesError.code);
    
    if (rolesError.code === 'PGRST116') {
      console.log('\n   💡 提示: profile_roles 表不存在');
      console.log('      需要运行数据库初始化脚本');
    }
  } else {
    console.log('   ✅ profile_roles 表查询成功');
    console.log('      找到', roles?.length || 0, '条记录');
    if (roles && roles.length > 0) {
      console.log('      示例:', roles);
    }
  }
  
  // 测试 3: 模拟 admin API 的查询逻辑
  console.log('\n6️⃣ 测试 Admin API 查询逻辑...');
  
  const { data: studentRoles, error: studentError } = await supabase
    .from('profile_roles')
    .select('profile_id')
    .eq('role', 'student');
  
  if (studentError) {
    console.log('   ❌ 查询学生角色失败:', studentError.message);
  } else {
    console.log('   ✅ 找到', studentRoles?.length || 0, '个学生角色');
    
    if (studentRoles && studentRoles.length > 0) {
      const studentIds = studentRoles.map(r => r.profile_id);
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', studentIds);
      
      if (studentsError) {
        console.log('   ❌ 查询学生资料失败:', studentsError.message);
      } else {
        console.log('   ✅ 找到', students?.length || 0, '个学生资料');
      }
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ 诊断完成！');
  console.log('\n如果看到错误，请根据上述提示进行修复。');
  console.log('常见问题：');
  console.log('1. 使用错误的 key (anon 而不是 service_role)');
  console.log('2. 数据库表不存在 (需要运行 init.sql)');
  console.log('3. .env 文件格式错误 (每行应该是 KEY=VALUE)');
  
} catch (err) {
  console.log('\n❌ 致命错误:', err.message);
  console.log('   错误堆栈:', err.stack);
  process.exit(1);
}


