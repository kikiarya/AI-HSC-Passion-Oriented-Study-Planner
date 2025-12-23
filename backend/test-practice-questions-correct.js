import { getSupabaseClient } from './clients/supabaseClient.js';

async function testPracticeQuestionsCorrectColumn() {
  const supabase = getSupabaseClient();
  
  console.log('=== Testing practice_questions correct column ===\n');
  
  try {
    // 1. Check the table structure
    console.log('1. Checking table structure...');
    const { data: columns, error: structureError } = await supabase
      .rpc('get_table_columns', { table_name: 'practice_questions' })
      .catch(() => {
        // If RPC doesn't exist, use a query instead
        return supabase
          .from('practice_questions')
          .select('*')
          .limit(1);
      });
    
    // 2. Get some sample data
    console.log('\n2. Fetching sample practice questions...');
    const { data: questions, error: questionsError } = await supabase
      .from('practice_questions')
      .select('id, question, attempted, correct, attempt_count')
      .limit(10)
      .order('created_at', { ascending: false });
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return;
    }
    
    console.log(`Found ${questions?.length || 0} practice questions`);
    
    if (questions && questions.length > 0) {
      console.log('\nSample data:');
      questions.forEach((q, idx) => {
        console.log(`\nQuestion ${idx + 1}:`);
        console.log(`  ID: ${q.id}`);
        console.log(`  Question: ${q.question.substring(0, 50)}...`);
        console.log(`  Attempted: ${q.attempted}`);
        console.log(`  Correct: ${q.correct}`);
        console.log(`  Correct type: ${typeof q.correct}`);
        console.log(`  Attempt count: ${q.attempt_count}`);
      });
    } else {
      console.log('No practice questions found in database');
    }
    
    // 3. Test update
    if (questions && questions.length > 0) {
      const testQuestion = questions[0];
      console.log('\n3. Testing update operation...');
      console.log(`Using question ID: ${testQuestion.id}`);
      
      // Try to update with explicit boolean value
      const testCorrectValue = true;
      console.log(`Attempting to set correct=${testCorrectValue} (type: ${typeof testCorrectValue})`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('practice_questions')
        .update({
          correct: testCorrectValue,
          attempt_count: (testQuestion.attempt_count || 0) + 1
        })
        .eq('id', testQuestion.id)
        .select();
      
      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log('Update successful!');
        console.log('Updated data:', updateData);
      }
      
      // Verify the update
      console.log('\n4. Verifying update...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('practice_questions')
        .select('id, correct, attempt_count')
        .eq('id', testQuestion.id)
        .single();
      
      if (verifyError) {
        console.error('Verify error:', verifyError);
      } else {
        console.log('Current value in database:');
        console.log(`  Correct: ${verifyData.correct}`);
        console.log(`  Correct type: ${typeof verifyData.correct}`);
        console.log(`  Attempt count: ${verifyData.attempt_count}`);
      }
    }
    
    // 4. Check incorrect_questions table
    console.log('\n5. Checking incorrect_questions table...');
    const { data: incorrectQuestions, error: incorrectError } = await supabase
      .from('incorrect_questions')
      .select('id, question_id, question, student_answer, correct_answer')
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (incorrectError) {
      console.error('Error fetching incorrect questions:', incorrectError);
    } else {
      console.log(`Found ${incorrectQuestions?.length || 0} incorrect questions`);
      if (incorrectQuestions && incorrectQuestions.length > 0) {
        console.log('\nSample incorrect questions:');
        incorrectQuestions.forEach((q, idx) => {
          console.log(`\n${idx + 1}. Question ID: ${q.question_id}`);
          console.log(`   Question: ${q.question.substring(0, 50)}...`);
          console.log(`   Student answer: ${q.student_answer}`);
          console.log(`   Correct answer: ${q.correct_answer}`);
        });
      }
    }
    
    console.log('\n=== Test completed ===');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPracticeQuestionsCorrectColumn();

