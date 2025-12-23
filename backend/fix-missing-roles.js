import { getSupabaseClient } from './clients/supabaseClient.js';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function fixMissingRoles() {
  console.log('🔧 修复缺失的角色分配\n');
  console.log('='.repeat(70));
  
  try {
    const supabase = getSupabaseClient();
    
    // Step 1: 获取所有用户
    console.log('\n1️⃣ 获取所有用户...');
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name');
    
    if (profilesError) {
      console.error('❌ 无法获取用户列表:', profilesError.message);
      return;
    }
    
    console.log(`✅ 找到 ${allProfiles?.length || 0} 个用户`);
    if (!allProfiles || allProfiles.length === 0) {
      console.log('ℹ️ 没有用户需要处理');
      return;
    }
    
    // Step 2: 检查现有的角色分配
    console.log('\n2️⃣ 检查现有的角色分配...');
    const { data: existingRoles, error: rolesError } = await supabase
      .from('profile_roles')
      .select('profile_id, role');
    
    if (rolesError) {
      console.error('❌ 无法获取角色列表:', rolesError.message);
      console.error('   这可能意味着 profile_roles 表不存在或无法访问');
      return;
    }
    
    console.log(`✅ 找到 ${existingRoles?.length || 0} 个现有角色分配`);
    
    // Step 3: 找出没有角色的用户
    const usersWithRoles = new Set(existingRoles?.map(r => r.profile_id) || []);
    const usersWithoutRoles = allProfiles.filter(p => !usersWithRoles.has(p.id));
    
    console.log(`\n3️⃣ 分析结果:`);
    console.log(`   - 有角色的用户: ${usersWithRoles.size}`);
    console.log(`   - 没有角色的用户: ${usersWithoutRoles.length}`);
    
    if (usersWithoutRoles.length === 0) {
      console.log('\n✅ 所有用户都已分配角色！');
      return;
    }
    
    // Step 4: 为没有角色的用户分配默认角色
    console.log(`\n4️⃣ 为 ${usersWithoutRoles.length} 个用户分配默认 student 角色...`);
    console.log('   注意：我们将为所有用户分配 student 角色作为默认值');
    console.log('   您之后可以通过管理员界面或数据库手动修改角色\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const user of usersWithoutRoles) {
      // 尝试插入 student 角色
      const { error: insertError } = await supabase
        .from('profile_roles')
        .insert({
          profile_id: user.id,
          role: 'student'
        });
      
      if (insertError) {
        console.error(`   ❌ 无法为用户 ${user.email || user.id} 分配角色:`, insertError.message);
        failCount++;
        
        // 如果是类型错误，尝试其他方法
        if (insertError.message.includes('invalid input value') || insertError.code === '23503') {
          console.log(`   ⚠️  可能是 role 字段类型问题，尝试使用 CAST...`);
          // 尝试使用原始 SQL 或不同的插入方式
        }
      } else {
        console.log(`   ✅ 为 ${user.email || user.id} 分配了 student 角色`);
        successCount++;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 修复结果:');
    console.log(`   ✅ 成功: ${successCount} 个用户`);
    console.log(`   ❌ 失败: ${failCount} 个用户`);
    
    if (successCount > 0) {
      console.log('\n✅ 修复完成！现在请：');
      console.log('1. 刷新管理员页面');
      console.log('2. 检查学生账户列表是否显示数据');
      console.log('3. 对于应该是 teacher 或 admin 的用户，请手动修改其角色');
    }
    
    // Step 5: 显示当前角色分布
    console.log('\n5️⃣ 当前角色分布:');
    const { data: allRoles } = await supabase
      .from('profile_roles')
      .select('role');
    
    if (allRoles) {
      const roleCounts = {};
      allRoles.forEach(r => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      console.log('   ', roleCounts);
    }
    
  } catch (err) {
    console.error('\n❌ 致命错误:', err.message);
    console.error(err.stack);
  }
}

fixMissingRoles();


