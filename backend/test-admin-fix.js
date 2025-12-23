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

async function testAdminQueries() {
  console.log('🧪 Testing Admin Queries\n');
  
  try {
    const supabase = getSupabaseClient();
    
    // Test 1: Get all student roles
    console.log('1️⃣ Testing student role query...');
    const { data: studentRoles, error: studentError } = await supabase
      .from('profile_roles')
      .select('profile_id, role')
      .eq('role', 'student');
    
    if (studentError) {
      console.error('   ❌ Error:', studentError.message);
      console.error('   Code:', studentError.code);
    } else {
      console.log(`   ✅ Found ${studentRoles?.length || 0} student roles`);
      if (studentRoles && studentRoles.length > 0) {
        const studentIds = studentRoles.map(r => r.profile_id).filter(id => id);
        console.log(`   Student IDs: ${studentIds.length} unique students`);
        
        if (studentIds.length > 0) {
          const { data: students, error: studentsError } = await supabase
            .from('profiles')
            .select('id, email, name')
            .in('id', studentIds.slice(0, 5)); // Test with first 5
          
          if (studentsError) {
            console.error('   ❌ Error fetching student profiles:', studentsError.message);
          } else {
            console.log(`   ✅ Successfully fetched ${students?.length || 0} student profiles`);
            console.log('   Sample:', students);
          }
        }
      }
    }
    
    // Test 2: Get all teacher roles
    console.log('\n2️⃣ Testing teacher role query...');
    const { data: teacherRoles, error: teacherError } = await supabase
      .from('profile_roles')
      .select('profile_id, role')
      .eq('role', 'teacher');
    
    if (teacherError) {
      console.error('   ❌ Error:', teacherError.message);
      console.error('   Code:', teacherError.code);
    } else {
      console.log(`   ✅ Found ${teacherRoles?.length || 0} teacher roles`);
      if (teacherRoles && teacherRoles.length > 0) {
        const teacherIds = teacherRoles.map(r => r.profile_id).filter(id => id);
        console.log(`   Teacher IDs: ${teacherIds.length} unique teachers`);
        
        if (teacherIds.length > 0) {
          const { data: teachers, error: teachersError } = await supabase
            .from('profiles')
            .select('id, email, name')
            .in('id', teacherIds.slice(0, 5)); // Test with first 5
          
          if (teachersError) {
            console.error('   ❌ Error fetching teacher profiles:', teachersError.message);
          } else {
            console.log(`   ✅ Successfully fetched ${teachers?.length || 0} teacher profiles`);
            console.log('   Sample:', teachers);
          }
        }
      }
    }
    
    // Test 3: Check all roles in database
    console.log('\n3️⃣ Checking all roles in database...');
    const { data: allRoles, error: allRolesError } = await supabase
      .from('profile_roles')
      .select('profile_id, role')
      .limit(20);
    
    if (allRolesError) {
      console.error('   ❌ Error:', allRolesError.message);
    } else {
      console.log(`   ✅ Total roles in database: ${allRoles?.length || 0}`);
      const roleCounts = {};
      allRoles?.forEach(r => {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
      });
      console.log('   Role distribution:', roleCounts);
    }
    
    console.log('\n✅ Tests completed!');
    
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    console.error(err.stack);
  }
}

testAdminQueries();


