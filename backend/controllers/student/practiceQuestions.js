import { getSupabaseClient } from '../../clients/supabaseClient.js';
import openaiClient from '../../clients/openaiClient.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate AI practice questions based on student's selected HSC subjects
 */
const generatePracticeQuestions = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();

    // 1. Get student's selected subjects
    const { data: selectedSubjects, error: subjectsError } = await supabase
      .from('selected_subjects')
      .select('*')
      .eq('student_id', studentId);

    if (subjectsError) {
      console.error('Error fetching selected subjects:', subjectsError);
      return res.status(500).json({ error: 'Failed to fetch selected subjects' });
    }

    if (!selectedSubjects || selectedSubjects.length === 0) {
      return res.status(400).json({ 
        error: 'No HSC subjects selected. Please select subjects first.' 
      });
    }

    // 2. Create a practice question set for the student
    const setTitle = `Practice Questions - ${new Date().toLocaleDateString()}`;
    const setDescription = `AI-generated practice questions based on your selected HSC subjects: ${selectedSubjects.map(s => s.subject_name).join(', ')}`;

    // Create a practice question set
    const { data: questionSet, error: setError } = await supabase
      .from('practice_question_sets')
      .insert({
        student_id: studentId,
        title: setTitle,
        description: setDescription,
        total_questions: 0, // Will be updated after generating questions
        total_points: 0
      })
      .select()
      .single();

    if (setError) {
      console.error('Error creating practice question set:', setError);
      return res.status(500).json({ error: 'Failed to create practice question set' });
    }

    // 3. Generate questions for each subject using OpenAI
    const allGeneratedQuestions = [];
    let totalPoints = 0;

    for (const subject of selectedSubjects) {
      try {
        // Load instruction template
        const instructionPath = path.join(__dirname, '../../instructions/assignment-generation-instruction.md');
        const instructionTemplate = await fs.readFile(instructionPath, 'utf-8');

        // Prepare OpenAI prompt
        const prompt = {
          subject: subject.subject_name,
          topic: 'General Practice',
          difficulty: 'medium',
          assignment_type: 'practice',
          question_count: 3 // Generate 3 questions per subject
        };

        const messages = [
          { role: 'system', content: instructionTemplate },
          { 
            role: 'user', 
            content: `Generate practice questions for the following:\n${JSON.stringify(prompt, null, 2)}\n\nReturn ONLY valid JSON with the structure specified in your instructions.` 
          }
        ];

        // Call OpenAI API
        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        // 清理OpenAI返回的内容，移除markdown代码块标记
        let rawContent = completion.choices[0].message.content.trim();
        
        // 移除 ```json 和 ``` 标记
        rawContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        rawContent = rawContent.trim();
        
        const generatedData = JSON.parse(rawContent);

        // 4. Save questions to database
        if (generatedData.questions && generatedData.questions.length > 0) {
          for (let i = 0; i < generatedData.questions.length; i++) {
            const q = generatedData.questions[i];
            
            const questionData = {
              set_id: questionSet.id,
              student_id: studentId,
              position: allGeneratedQuestions.length + 1,
              type: q.type || 'multiple_choice',
              question: q.question || q.prompt,
              points: q.points || 10,
              subject: subject.subject_name, // Tag with subject
              subject_code: subject.subject_code,
              correct_answer: q.answer || null,
              explanation: q.explanation || null
            };

            const { data: insertedQuestion, error: questionError } = await supabase
              .from('practice_questions')
              .insert(questionData)
              .select()
              .single();

            if (questionError) {
              console.error('Error inserting question:', questionError);
              continue;
            }

            totalPoints += q.points || 10;
            allGeneratedQuestions.push(insertedQuestion);

            // 5. If it's a multiple choice question, save options
            console.log('Question type:', q.type);
            console.log('Question options:', q.options);
            
            if (q.type === 'multiple_choice' && q.options) {
              const options = q.options.map((optionText, idx) => ({
                question_id: insertedQuestion.id,
                option_text: optionText,
                is_correct: q.answer === optionText || q.answer === String.fromCharCode(65 + idx),
                position: idx
              }));

              console.log('Inserting options:', options);

              const { error: optionsError } = await supabase
                .from('practice_question_options')
                .insert(options);

              if (optionsError) {
                console.error('Error inserting options:', optionsError);
              } else {
                console.log(`Successfully inserted ${options.length} options for question ${insertedQuestion.id}`);
              }
            } else {
              console.log('Skipping options - not a multiple choice or no options provided');
            }
          }
        }
      } catch (subjectError) {
        console.error(`Error generating questions for ${subject.subject_name}:`, subjectError);
        // Continue with other subjects even if one fails
      }
    }

    // 6. Update question set totals
    await supabase
      .from('practice_question_sets')
      .update({ 
        total_questions: allGeneratedQuestions.length,
        total_points: totalPoints 
      })
      .eq('id', questionSet.id);

    // 7. Return success response
    return res.status(200).json({
      success: true,
      message: 'Practice questions generated successfully',
      setId: questionSet.id,
      questionsGenerated: allGeneratedQuestions.length,
      subjects: selectedSubjects.map(s => s.subject_name),
      totalPoints: totalPoints
    });

  } catch (error) {
    console.error('Error generating practice questions:', error);
    return res.status(500).json({ 
      error: 'Failed to generate practice questions',
      details: error.message 
    });
  }
};

/**
 * Get practice question statistics for the student
 */
const getPracticeStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const supabase = getSupabaseClient();

    // Count total practice question sets generated for this student
    const { data: sets, error: setsError } = await supabase
      .from('practice_question_sets')
      .select('id, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (setsError) {
      console.error('Error fetching practice question sets:', setsError);
      return res.status(500).json({ error: 'Failed to fetch practice stats' });
    }

    const totalGenerated = sets?.length || 0;
    const lastGenerated = sets?.[0]?.created_at || null;

    return res.status(200).json({
      totalGenerated,
      lastGenerated
    });

  } catch (error) {
    console.error('Error fetching practice stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch practice stats',
      details: error.message 
    });
  }
};

export { generatePracticeQuestions, getPracticeStats };

