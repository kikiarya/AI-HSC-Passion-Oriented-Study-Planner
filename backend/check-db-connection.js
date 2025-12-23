import { getSupabaseClient } from './clients/supabaseClient.js';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

console.log('🔍 Checking Database Connection Configuration\n');
console.log('='.repeat(60));

// Check if .env file exists
const envPath = './.env';
if (existsSync(envPath)) {
  console.log('✅ .env file found');
  dotenv.config();
} else {
  console.log('❌ .env file NOT FOUND!');
  console.log('   Please create backend/.env file with:');
  console.log('   SUPABASE_URL=https://your-project.supabase.co');
  console.log('   SUPABASE_KEY=your-service-role-key');
  console.log('\n   See BACKEND_ENV_SETUP.md for instructions.');
  process.exit(1);
}

console.log('\n📋 Environment Variables:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('   SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Not set');

if (process.env.SUPABASE_KEY) {
  const keyStart = process.env.SUPABASE_KEY.substring(0, 40);
  console.log('   Key preview:', keyStart + '...');
  
  // Decode JWT to check key type
  try {
    const payload = JSON.parse(
      Buffer.from(process.env.SUPABASE_KEY.split('.')[1], 'base64').toString()
    );
    console.log('   Key role:', payload.role || 'unknown');
    
    if (payload.role === 'anon') {
      console.log('\n❌ ERROR: You are using the ANON key!');
      console.log('   Backend requires SERVICE_ROLE key!');
      console.log('   Get it from: Supabase Dashboard → Settings → API → service_role');
      process.exit(1);
    } else if (payload.role === 'service_role') {
      console.log('   ✅ Using correct service_role key');
    }
  } catch (e) {
    console.log('   ⚠️  Could not decode key');
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n🔌 Testing Database Connection...\n');

try {
  const supabase = getSupabaseClient();
  
  // Test 1: Check profiles table
  console.log('1️⃣ Testing profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, name')
    .limit(5);
  
  if (profilesError) {
    console.error('   ❌ Error:', profilesError.message);
    console.error('   Code:', profilesError.code);
    console.error('   Details:', profilesError.details);
  } else {
    console.log(`   ✅ Success! Found ${profiles?.length || 0} profiles`);
    if (profiles && profiles.length > 0) {
      console.log('   Sample profiles:', profiles);
    }
  }
  
  // Test 2: Check profile_roles table
  console.log('\n2️⃣ Testing profile_roles table...');
  const { data: roles, error: rolesError } = await supabase
    .from('profile_roles')
    .select('profile_id, role')
    .limit(10);
  
  if (rolesError) {
    console.error('   ❌ Error:', rolesError.message);
    console.error('   Code:', rolesError.code);
    console.error('   Details:', rolesError.details);
  } else {
    console.log(`   ✅ Success! Found ${roles?.length || 0} role assignments`);
    if (roles && roles.length > 0) {
      console.log('   Sample roles:', roles);
    }
  }
  
  // Test 3: Check students
  console.log('\n3️⃣ Testing student query (admin endpoint logic)...');
  const { data: studentRoles, error: studentRolesError } = await supabase
    .from('profile_roles')
    .select('profile_id')
    .eq('role', 'student');
  
  if (studentRolesError) {
    console.error('   ❌ Error:', studentRolesError.message);
  } else {
    console.log(`   ✅ Found ${studentRoles?.length || 0} student roles`);
    
    if (studentRoles && studentRoles.length > 0) {
      const studentIds = studentRoles.map(r => r.profile_id);
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', studentIds);
      
      if (studentsError) {
        console.error('   ❌ Error fetching student profiles:', studentsError.message);
      } else {
        console.log(`   ✅ Found ${students?.length || 0} student profiles`);
      }
    }
  }
  
  // Test 4: Check teachers
  console.log('\n4️⃣ Testing teacher query (admin endpoint logic)...');
  const { data: teacherRoles, error: teacherRolesError } = await supabase
    .from('profile_roles')
    .select('profile_id')
    .eq('role', 'teacher');
  
  if (teacherRolesError) {
    console.error('   ❌ Error:', teacherRolesError.message);
  } else {
    console.log(`   ✅ Found ${teacherRoles?.length || 0} teacher roles`);
    
    if (teacherRoles && teacherRoles.length > 0) {
      const teacherIds = teacherRoles.map(r => r.profile_id);
      const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', teacherIds);
      
      if (teachersError) {
        console.error('   ❌ Error fetching teacher profiles:', teachersError.message);
      } else {
        console.log(`   ✅ Found ${teachers?.length || 0} teacher profiles`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Database connection test completed!');
  console.log('\nIf you see errors above, please:');
  console.log('1. Check that backend/.env file exists and has correct values');
  console.log('2. Verify SUPABASE_KEY is the service_role key (not anon key)');
  console.log('3. Check that tables exist in your Supabase database');
  console.log('4. Run db_scripts/init.sql if tables are missing');
  
} catch (err) {
  console.error('\n❌ Fatal error:', err.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure backend/.env file exists');
  console.error('2. Check that SUPABASE_URL and SUPABASE_KEY are set correctly');
  console.error('3. Verify you are using the service_role key (not anon key)');
  console.error('4. See BACKEND_ENV_SETUP.md for detailed instructions');
  process.exit(1);
}


