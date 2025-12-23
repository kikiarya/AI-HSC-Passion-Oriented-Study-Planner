import { getSupabaseClient } from './clients/supabaseClient.js';

async function testModuleItemUpdate() {
  const supabase = getSupabaseClient();
  
  console.log('Testing module item file update...');
  
  // First, check if the table and columns exist
  const { data: items, error: fetchErr } = await supabase
    .from('class_module_items')
    .select('*')
    .limit(1);
  
  if (fetchErr) {
    console.error('Error fetching items:', fetchErr);
    return;
  }
  
  console.log('Sample item columns:', items?.[0] ? Object.keys(items[0]) : 'No items found');
  
  // Try to find a file-type item
  const { data: fileItem, error: fileErr } = await supabase
    .from('class_module_items')
    .select('*')
    .eq('item_type', 'file')
    .limit(1)
    .single();
  
  if (fileErr) {
    console.error('Error finding file item:', fileErr);
    console.log('Create a file item first via the UI');
    return;
  }
  
  console.log('Found file item:', fileItem);
  
  // Try to update it
  const { data: updated, error: updateErr } = await supabase
    .from('class_module_items')
    .update({
      file_storage_path: 'test/path/file.txt',
      file_mime_type: 'text/plain',
      file_size_bytes: 100,
      file_public_url: 'https://example.com/test.txt'
    })
    .eq('id', fileItem.id)
    .select()
    .single();
  
  if (updateErr) {
    console.error('Update error:', updateErr);
    console.error('Full error:', JSON.stringify(updateErr, null, 2));
  } else {
    console.log('Update successful:', updated);
  }
}

testModuleItemUpdate().catch(console.error);

