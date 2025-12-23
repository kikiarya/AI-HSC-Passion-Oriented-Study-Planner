import { getSupabaseClient } from './clients/supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAdminDatabase() {
  console.log('🧪 Testing Admin Database Connection\n');
  
  try {
    const supabase = getSupabaseClient();
    
    // Test 1: Check profile_roles table
    console.log('1️⃣ Testing profile_roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('profile_roles')
      .select('*')
      .limit(10);
    
    if (rolesError) {
      console.error('❌ Error querying profile_roles:', rolesError);
    } else {
      console.log(`✅ Found ${roles?.length || 0} roles in database`);
      console.log('Sample roles:', roles);
    }
    
    // Test 2: Check students
    console.log('\n2️⃣ Testing student roles...');
    const { data: studentRoles, error: studentError } = await supabase
      .from('profile_roles')
      .select('profile_id')
      .eq('role', 'student');
    
    if (studentError) {
      console.error('❌ Error querying student roles:', studentError);
    } else {
      console.log(`✅ Found ${studentRoles?.length || 0} student roles`);
      if (studentRoles && studentRoles.length > 0) {
        const studentIds = studentRoles.map(r => r.profile_id);
        console.log('Student IDs:', studentIds);
        
        // Test 3: Get student profiles
        console.log('\n3️⃣ Testing student profiles...');
        const { data: students, error: studentsError } = await supabase
          .from('profiles')
          .select('id, email, name, created_at')
          .in('id', studentIds);
        
        if (studentsError) {
          console.error('❌ Error querying student profiles:', studentsError);
        } else {
          console.log(`✅ Found ${students?.length || 0} student profiles`);
          console.log('Students:', students);
        }
      }
    }
    
    // Test 4: Check teachers
    console.log('\n4️⃣ Testing teacher roles...');
    const { data: teacherRoles, error: teacherError } = await supabase
      .from('profile_roles')
      .select('profile_id')
      .eq('role', 'teacher');
    
    if (teacherError) {
      console.error('❌ Error querying teacher roles:', teacherError);
    } else {
      console.log(`✅ Found ${teacherRoles?.length || 0} teacher roles`);
      if (teacherRoles && teacherRoles.length > 0) {
        const teacherIds = teacherRoles.map(r => r.profile_id);
        console.log('Teacher IDs:', teacherIds);
        
        // Test 5: Get teacher profiles
        console.log('\n5️⃣ Testing teacher profiles...');
        const { data: teachers, error: teachersError } = await supabase
          .from('profiles')
          .select('id, email, name, created_at')
          .in('id', teacherIds);
        
        if (teachersError) {
          console.error('❌ Error querying teacher profiles:', teachersError);
        } else {
          console.log(`✅ Found ${teachers?.length || 0} teacher profiles`);
          console.log('Teachers:', teachers);
        }
      }
    }
    
    // Test 6: Check profiles table structure
    console.log('\n6️⃣ Testing profiles table structure...');
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError);
    } else {
      console.log(`✅ Found ${allProfiles?.length || 0} total profiles`);
      if (allProfiles && allProfiles.length > 0) {
        console.log('Sample profile structure:', allProfiles[0]);
      }
    }
    
    console.log('\n✅ Database connection test completed!');
    
  } catch (err) {
    console.error('❌ Fatal error:', err);
  }
}

testAdminDatabase();


