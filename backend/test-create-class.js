// Quick test script to verify class creation
import { getSupabaseClient } from './clients/supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCreateClass() {
  console.log('🧪 Testing class creation...');
  
  // Initialize Supabase
  const supabase = getSupabaseClient();
  console.log('✅ Supabase client initialized');
  
  // Test 1: Check if classes table exists
  console.log('\n📋 Test 1: Check if classes table exists...');
  const { data: tables, error: tableError } = await supabase
    .from('classes')
    .select('*')
    .limit(1);
  
  if (tableError) {
    console.error('❌ Table check failed:', tableError);
    console.error('Code:', tableError.code);
    console.error('Message:', tableError.message);
    console.error('Details:', tableError.details);
    return;
  }
  console.log('✅ Classes table exists');
  
  // Test 2: Try to insert a test class
  console.log('\n📝 Test 2: Try to insert a test class...');
  const { data: newClass, error: insertError } = await supabase
    .from('classes')
    .insert([{
      code: 'TEST-' + Date.now(),
      name: 'Test Class',
      description: 'Testing class creation',
      color: '#667eea',
      location: 'Room 999',
      teacher: 'System Test'
    }])
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError);
    console.error('Code:', insertError.code);
    console.error('Message:', insertError.message);
    console.error('Details:', insertError.details);
    console.error('Hint:', insertError.hint);
    return;
  }
  console.log('✅ Class created successfully!');
  console.log('Created class:', newClass);
  
  // Test 3: Clean up (delete test class)
  console.log('\n🧹 Test 3: Cleaning up test class...');
  const { error: deleteError } = await supabase
    .from('classes')
    .delete()
    .eq('id', newClass.id);
  
  if (deleteError) {
    console.error('⚠️ Cleanup failed:', deleteError);
  } else {
    console.log('✅ Test class deleted');
  }
  
  console.log('\n✅ All tests passed!');
}

testCreateClass().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

