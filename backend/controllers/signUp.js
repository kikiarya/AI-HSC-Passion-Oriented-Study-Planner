import { getSupabaseClient } from '../clients/supabaseClient.js';
import { ErrorResponse } from '../utils/errorResponse.js';

const signUp = async (req, res) => {
  try {
    const { email, password, firstName, lastName, classCode } = req.body || {};

    if (!email || !password || !firstName || !lastName) {
      return ErrorResponse.badRequest('Email, password, first name, and last name are required').send(res);
    }

    // Student registration requires a class code
    if (!classCode) {
      return ErrorResponse.badRequest('Class code is required for student registration').send(res);
    }

    const supabase = getSupabaseClient();
    
    // Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          // Use a single name field to match current profiles schema
          name: `${firstName} ${lastName}`,
        },
      },
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      return ErrorResponse.badRequest(signUpError.message).send(res);
    }

    if (!signUpData.user) {
      return ErrorResponse.internalServerError('User creation failed').send(res);
    }

    const userId = signUpData.user.id;

    // If student, enroll them in the class using the class code
    // Find the class by code
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('code', classCode)
      .single();

    if (classError || !classData) {
      console.error('Class lookup error:', classError);
      return ErrorResponse.badRequest('Invalid class code').send(res);
    }

    // Enroll student in the class
    const { error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        student_id: userId,
        class_id: classData.id,
      });

    if (enrollError) {
      console.error('Enrollment error:', enrollError);
      return ErrorResponse.internalServerError('Failed to enroll in class').send(res);
    }

    return res.status(201).json({ 
      message: 'Registration successful',
      user: {
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: 'student',
      },
      session: signUpData.session ? {
        access_token: signUpData.session.access_token,
        refresh_token: signUpData.session.refresh_token,
        expires_at: signUpData.session.expires_at,
      } : null,
    });
  } catch (err) {
    console.error('SignUp error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

export { signUp };