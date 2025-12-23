import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend directory
// __dirname points to backend/clients, so we need to go up one level
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📄 Loaded .env file from:', envPath);
} else {
  // Try default location (current directory)
  console.warn('⚠️  WARNING: .env file not found at:', envPath);
  console.warn('   Trying default dotenv.config()...');
  dotenv.config();
}

let supabaseClientInstance; 

function getSupabaseClient() {
  if (!supabaseClientInstance) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    // Validate environment variables with detailed error messages
    if (!supabaseUrl) {
      console.error('❌ SUPABASE_URL is not set!');
      console.error('   Please create backend/.env file with:');
      console.error('   SUPABASE_URL=https://your-project.supabase.co');
      throw new Error('SUPABASE_URL must be set in environment variables. Check backend/.env file.');
    }
    
    if (!supabaseKey) {
      console.error('❌ SUPABASE_KEY is not set!');
      console.error('   Please create backend/.env file with:');
      console.error('   SUPABASE_KEY=your-service-role-key-here');
      console.error('   (Get it from: Supabase Dashboard → Settings → API → service_role)');
      throw new Error('SUPABASE_KEY must be set in environment variables. Check backend/.env file.');
    }
    
    // Check if using the correct key type
    try {
      const payload = JSON.parse(
        Buffer.from(supabaseKey.split('.')[1], 'base64').toString()
      );
      
      if (payload.role === 'anon') {
        console.error('❌ ERROR: You are using the ANON key instead of SERVICE_ROLE key!');
        console.error('   The anon key will not work for backend operations.');
        console.error('   Please use the service_role key from:');
        console.error('   Supabase Dashboard → Settings → API → service_role (secret)');
        throw new Error('Wrong key type: Using anon key instead of service_role key. Backend requires service_role key.');
      }
      
      if (payload.role !== 'service_role') {
        console.warn('⚠️  WARNING: Key role is:', payload.role);
      }
    } catch (e) {
      console.warn('⚠️  Could not verify key type:', e.message);
    }
    
    // Create client with service role options
    supabaseClientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    
    console.log('✅ Supabase client initialized');
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Key starts with:', supabaseKey.substring(0, 30) + '...');
    
    // Test connection
    testConnection(supabaseClientInstance);
  }
  return supabaseClientInstance;
}

// Test database connection
async function testConnection(supabase) {
  try {
    console.log('🧪 Testing database connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection test failed:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error details:', error.details);
    } else {
      console.log('✅ Database connection successful!');
    }
  } catch (err) {
    console.error('❌ Database connection test error:', err.message);
  }
}

export {
    getSupabaseClient
};


