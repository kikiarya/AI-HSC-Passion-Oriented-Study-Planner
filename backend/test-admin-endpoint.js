import { getSupabaseClient } from './clients/supabaseClient.js';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function testAdminEndpoint() {
  console.log('🧪 测试管理员API查询逻辑\n');
  console.log('='.repeat(70));
  
  try {
    const supabase = getSupabaseClient();
    
    // Test 1: 直接查询所有profiles
    console.log('\n1️⃣ 直接查询所有profiles...');
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, created_at')
      .limit(10);
    
    if (profilesError) {
      console.error('❌ 错误:', profilesError.message);
      console.error('   代码:', profilesError.code);
    } else {
      console.log(`✅ 找到 ${allProfiles?.length || 0} 个用户`);
      if (allProfiles && allProfiles.length > 0) {
        console.log('   示例用户:', allProfiles.slice(0, 3));
      }
    }
    
    // Test 2: 查询profile_roles表
    console.log('\n2️⃣ 查询profile_roles表...');
    const { data: allRoles, error: rolesError } = await supabase
      .from('profile_roles')
      .select('profile_id, role');
    
    if (rolesError) {
      console.error('❌ 错误:', rolesError.message);
      console.error('   代码:', rolesError.code);
      console.error('   详情:', rolesError.details);
    } else {
      console.log(`✅ 找到 ${allRoles?.length || 0} 个角色分配`);
      if (allRoles && allRoles.length > 0) {
        console.log('   示例角色:', allRoles.slice(0, 5));
        
        // Test 3: 按角色分组
        const studentRoles = allRoles.filter(r => String(r.role).toLowerCase() === 'student');
        const teacherRoles = allRoles.filter(r => String(r.role).toLowerCase() === 'teacher');
        const adminRoles = allRoles.filter(r => String(r.role).toLowerCase() === 'admin');
        
        console.log(`\n   角色分布:`);
        console.log(`   - Student: ${studentRoles.length}`);
        console.log(`   - Teacher: ${teacherRoles.length}`);
        console.log(`   - Admin: ${adminRoles.length}`);
        
        // Test 4: 模拟getStudents逻辑
        if (studentRoles.length > 0) {
          console.log('\n3️⃣ 模拟getStudents查询逻辑...');
          const studentIds = studentRoles.map(r => r.profile_id);
          console.log(`   学生IDs (${studentIds.length}个):`, studentIds.slice(0, 3));
          
          const { data: students, error: studentsError } = await supabase
            .from('profiles')
            .select('id, email, name, created_at')
            .in('id', studentIds.slice(0, 5)); // 只测试前5个
          
          if (studentsError) {
            console.error('   ❌ 查询学生profiles失败:', studentsError.message);
          } else {
            console.log(`   ✅ 成功查询到 ${students?.length || 0} 个学生`);
            console.log('   学生数据:', students);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 总结:');
    console.log(`   - Profiles表: ${allProfiles?.length || 0} 个用户`);
    console.log(`   - Profile_roles表: ${allRoles?.length || 0} 个角色分配`);
    
    if (allProfiles && allProfiles.length > 0 && (!allRoles || allRoles.length === 0)) {
      console.log('\n⚠️  警告: 有用户但没有角色分配！');
      console.log('   需要运行 fix_existing_users_roles.sql 或手动分配角色');
    }
    
  } catch (err) {
    console.error('\n❌ 致命错误:', err.message);
    console.error(err.stack);
  }
}

testAdminEndpoint();


