import { getSupabaseClient } from './clients/supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabase() {
  console.log('🧪 Testing Supabase Configuration\n');
  console.log('=' .repeat(50));
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ Set' : '❌ Not set');
  
  if (process.env.SUPABASE_KEY) {
    const keyStart = process.env.SUPABASE_KEY.substring(0, 50);
    console.log('\n🔑 Key Preview:', keyStart + '...');
    
    // Try to decode the JWT to check if it's service_role or anon
    try {
      const payload = JSON.parse(
        Buffer.from(process.env.SUPABASE_KEY.split('.')[1], 'base64').toString()
      );
      console.log('\n🎯 Token Role:', payload.role || 'unknown');
      
      if (payload.role === 'anon') {
        console.log('❌ WARNING: You are using the ANON key!');
        console.log('   You need to use the SERVICE_ROLE key instead.');
        console.log('   Find it in: Supabase Dashboard → Settings → API → service_role');
      } else if (payload.role === 'service_role') {
        console.log('✅ CORRECT: Using service_role key');
      }
    } catch (e) {
      console.log('⚠️  Could not decode JWT token');
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n🔌 Testing Database Connection...\n');
  
  try {
    const supabase = getSupabaseClient();
    
    // Test 1: Query profiles table
    console.log('Test 1: Querying profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError.message);
    } else {
      console.log('✅ Profiles table accessible');
      console.log('   Records found:', profilesData.length);
    }
    
    // Test 2: Check profiles columns
    console.log('\nTest 2: Checking profiles table structure...');
    const { data: columnsData, error: columnsError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'` 
      })
      .catch(() => {
        // Fallback: try to insert a test record to see what columns exist
        return { data: null, error: 'RPC not available' };
      });
    
    // Try selecting specific columns we need
    const { error: columnTest } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .limit(1);
    
    if (columnTest) {
      if (columnTest.message.includes('first_name')) {
        console.log('❌ Missing first_name column');
        console.log('   Run the QUICK_FIX_RLS.sql script!');
      } else {
        console.log('❌ Column test failed:', columnTest.message);
      }
    } else {
      console.log('✅ Required columns exist (id, email, first_name, last_name)');
    }
    
    // Test 3: Query profile_roles table
    console.log('\nTest 3: Querying profile_roles table...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('profile_roles')
      .select('*')
      .limit(1);
    
    if (rolesError) {
      console.error('❌ profile_roles query failed:', rolesError.message);
      if (rolesError.code === '42501') {
        console.log('   This is an RLS policy error!');
        console.log('   Run the QUICK_FIX_RLS.sql script!');
      }
    } else {
      console.log('✅ profile_roles table accessible');
      console.log('   Records found:', rolesData.length);
    }
    
    // Test 4: Try to insert a role (this will fail but shows us the error)
    console.log('\nTest 4: Testing insert permissions...');
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { error: insertError } = await supabase
      .from('profile_roles')
      .insert({ profile_id: testUserId, role: 'student' });
    
    if (insertError) {
      if (insertError.code === '42501') {
        console.log('❌ RLS policy blocking insert');
        console.log('   This is the issue preventing user registration!');
        console.log('   Run the QUICK_FIX_RLS.sql script to fix this!');
      } else if (insertError.code === '23503') {
        console.log('✅ Insert permission OK (foreign key error is expected)');
      } else {
        console.log('⚠️  Insert test error:', insertError.message);
      }
    } else {
      console.log('✅ Insert permission OK');
      // Clean up test data
      await supabase.from('profile_roles').delete().eq('profile_id', testUserId);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Summary:\n');
    
    const issues = [];
    if (process.env.SUPABASE_KEY && process.env.SUPABASE_KEY.includes('anon')) {
      issues.push('❌ Using anon key instead of service_role key');
    }
    if (columnTest?.message?.includes('first_name')) {
      issues.push('❌ Missing first_name/last_name columns in profiles table');
    }
    if (rolesError?.code === '42501' || insertError?.code === '42501') {
      issues.push('❌ RLS policies blocking operations');
    }
    
    if (issues.length === 0) {
      console.log('✅ All tests passed! Your configuration looks good.');
      console.log('   If registration still fails, check backend logs for other errors.');
    } else {
      console.log('Found issues:');
      issues.forEach(issue => console.log(issue));
      console.log('\n📝 To fix:');
      console.log('1. Make sure you\'re using the SERVICE_ROLE key from Supabase Dashboard');
      console.log('2. Run db_scripts/QUICK_FIX_RLS.sql in Supabase SQL Editor');
      console.log('3. Restart your backend server');
    }
    
  } catch (err) {
    console.error('\n💥 Fatal error:', err.message);
    console.error(err);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

testSupabase();

