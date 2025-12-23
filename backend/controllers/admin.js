import { getSupabaseClient } from '../clients/supabaseClient.js';
import { ErrorResponse } from '../utils/errorResponse.js';

/**
 * Get all students
 */
export const getStudents = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    
    // Use a JOIN query to get students with their profiles in one go
    // This handles both enum and text role types by using a text comparison
    const { data: roleData, error: roleError } = await supabase
      .from('profile_roles')
      .select(`
        profile_id,
        role,
        profiles!inner (
          id,
          email,
          name,
          created_at
        )
      `)
      .eq('role', 'student');

    // If direct query fails (maybe due to enum type), get all roles and filter
    if (roleError || !roleData || roleData.length === 0) {
      // Get all roles first
      const { data: allRolesData, error: allRolesError } = await supabase
        .from('profile_roles')
        .select('profile_id, role');
      
      if (allRolesError) {
        console.error('❌ Error fetching roles:', allRolesError);
        return ErrorResponse.internalServerError(`Failed to fetch roles: ${allRolesError.message}`).send(res);
      }
      
      // Filter for student roles (handle both enum and text types)
      const studentRoles = (allRolesData || []).filter(r => {
        const roleStr = String(r.role).toLowerCase().trim();
        return roleStr === 'student';
      });
      
      if (studentRoles.length === 0) {
        return res.status(200).json({
          message: 'Students fetched successfully',
          students: [],
        });
      }
      
      const studentIds = studentRoles.map(r => r.profile_id).filter(id => id);
      
      // Get student profiles
      const { data: students, error: studentsError } = await supabase
        .from('profiles')
        .select('id, email, name, created_at')
        .in('id', studentIds);
      
      if (studentsError) {
        console.error('❌ Error fetching students:', studentsError);
        return ErrorResponse.internalServerError(`Failed to fetch students: ${studentsError.message}`).send(res);
      }
      
      // Format the response
      const formattedStudents = (students || []).map(student => ({
        id: student.id,
        email: student.email,
        name: student.name || '',
        createdAt: student.created_at,
      }));

      return res.status(200).json({
        message: 'Students fetched successfully',
        students: formattedStudents,
      });
    }

    // If JOIN query worked, format the response
    const formattedStudents = roleData
      .filter(item => item.profiles) // Ensure profiles exists
      .map(item => ({
        id: item.profiles.id,
        email: item.profiles.email,
        name: item.profiles.name || '',
        createdAt: item.profiles.created_at,
      }));

    return res.status(200).json({
      message: 'Students fetched successfully',
      students: formattedStudents,
    });
  } catch (err) {
    console.error('❌ Get students error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Get all teachers
 */
export const getTeachers = async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    
    // Use a JOIN query to get teachers with their profiles in one go
    // This handles both enum and text role types by using a text comparison
    const { data: roleData, error: roleError } = await supabase
      .from('profile_roles')
      .select(`
        profile_id,
        role,
        profiles!inner (
          id,
          email,
          name,
          created_at
        )
      `)
      .eq('role', 'teacher');

    // If direct query fails (maybe due to enum type), get all roles and filter
    if (roleError || !roleData || roleData.length === 0) {
      // Get all roles first
      const { data: allRolesData, error: allRolesError } = await supabase
        .from('profile_roles')
        .select('profile_id, role');
      
      if (allRolesError) {
        console.error('❌ Error fetching roles:', allRolesError);
        return ErrorResponse.internalServerError(`Failed to fetch roles: ${allRolesError.message}`).send(res);
      }
      
      // Filter for teacher roles (handle both enum and text types)
      const teacherRoles = (allRolesData || []).filter(r => {
        const roleStr = String(r.role).toLowerCase().trim();
        return roleStr === 'teacher';
      });
      
      if (teacherRoles.length === 0) {
        return res.status(200).json({
          message: 'Teachers fetched successfully',
          teachers: [],
        });
      }
      
      const teacherIds = teacherRoles.map(r => r.profile_id).filter(id => id);
      
      // Get teacher profiles
      const { data: teachers, error: teachersError } = await supabase
        .from('profiles')
        .select('id, email, name, created_at')
        .in('id', teacherIds);
      
      if (teachersError) {
        console.error('❌ Error fetching teachers:', teachersError);
        return ErrorResponse.internalServerError(`Failed to fetch teachers: ${teachersError.message}`).send(res);
      }
      
      // Format the response
      const formattedTeachers = (teachers || []).map(teacher => ({
        id: teacher.id,
        email: teacher.email,
        name: teacher.name || '',
        createdAt: teacher.created_at,
      }));

      return res.status(200).json({
        message: 'Teachers fetched successfully',
        teachers: formattedTeachers,
      });
    }

    // If JOIN query worked, format the response
    const formattedTeachers = roleData
      .filter(item => item.profiles) // Ensure profiles exists
      .map(item => ({
        id: item.profiles.id,
        email: item.profiles.email,
        name: item.profiles.name || '',
        createdAt: item.profiles.created_at,
      }));

    return res.status(200).json({
      message: 'Teachers fetched successfully',
      teachers: formattedTeachers,
    });
  } catch (err) {
    console.error('❌ Get teachers error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Create a student account
 */
export const createStudent = async (req, res) => {
  try {
    const { email, password, firstName, lastName, classCode } = req.body || {};

    if (!email || !password || !firstName || !lastName) {
      return ErrorResponse.badRequest('Email, password, first name, and last name are required').send(res);
    }

    const supabase = getSupabaseClient();

    // Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
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

    // Assign student role
    const { error: roleError } = await supabase
      .from('profile_roles')
      .insert({
        profile_id: userId,
        role: 'student',
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Try to clean up the user if role assignment fails
      await supabase.auth.admin.deleteUser(userId);
      return ErrorResponse.internalServerError('Failed to assign student role').send(res);
    }

    // If classCode provided, enroll student in class
    if (classCode) {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('code', classCode)
        .single();

      if (!classError && classData) {
        await supabase
          .from('enrollments')
          .insert({
            student_id: userId,
            class_id: classData.id,
          });
      }
    }

    return res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: userId,
        email: email,
        name: `${firstName} ${lastName}`,
        role: 'student',
      },
    });
  } catch (err) {
    console.error('Create student error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Create a teacher account
 */
export const createTeacher = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body || {};

    if (!email || !password || !firstName || !lastName) {
      return ErrorResponse.badRequest('Email, password, first name, and last name are required').send(res);
    }

    const supabase = getSupabaseClient();

    // Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
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

    // Wait a moment for database triggers to complete (if they exist)
    await new Promise(resolve => setTimeout(resolve, 200));

    // Remove ALL existing roles for this user (including default student role from trigger)
    const { error: deleteError } = await supabase
      .from('profile_roles')
      .delete()
      .eq('profile_id', userId);

    if (deleteError) {
      console.warn('Warning: Could not delete existing roles:', deleteError.message);
      // Continue anyway - the insert might work
    }

    // Then insert the teacher role
    const { error: roleError } = await supabase
      .from('profile_roles')
      .insert({
        profile_id: userId,
        role: 'teacher',
      });

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Try to clean up the user if role assignment fails
      await supabase.auth.admin.deleteUser(userId);
      return ErrorResponse.internalServerError(`Failed to assign teacher role: ${roleError.message}`).send(res);
    }

    return res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: userId,
        email: email,
        name: `${firstName} ${lastName}`,
        role: 'teacher',
      },
    });
  } catch (err) {
    console.error('Create teacher error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Update user information
 */
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, firstName, lastName } = req.body || {};

    if (!userId) {
      return ErrorResponse.badRequest('User ID is required').send(res);
    }

    const supabase = getSupabaseClient();

    // Update profile
    const updateData = {};
    if (firstName && lastName) {
      updateData.name = `${firstName} ${lastName}`;
    }
    if (email) {
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return ErrorResponse.badRequest('No fields to update').send(res);
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      return ErrorResponse.internalServerError('Failed to update profile').send(res);
    }

    // If email changed, update auth users table (requires admin access)
    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        email: email,
      });

      if (authError) {
        console.error('Auth email update error:', authError);
        // Not fatal, continue
      }
    }

    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
      },
    });
  } catch (err) {
    console.error('Update user error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Delete/disable a user account
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return ErrorResponse.badRequest('User ID is required').send(res);
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return ErrorResponse.badRequest('You cannot delete your own account').send(res);
    }

    const supabase = getSupabaseClient();

    // Delete user from auth (cascade will handle profile and roles)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return ErrorResponse.internalServerError('Failed to delete user').send(res);
    }

    return res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (err) {
    console.error('Delete user error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

/**
 * Reset user password (admin can reset passwords)
 */
export const resetUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body || {};

    if (!userId || !newPassword) {
      return ErrorResponse.badRequest('User ID and new password are required').send(res);
    }

    if (newPassword.length < 8) {
      return ErrorResponse.badRequest('Password must be at least 8 characters').send(res);
    }

    const supabase = getSupabaseClient();

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error('Password reset error:', updateError);
      return ErrorResponse.internalServerError('Failed to reset password').send(res);
    }

    return res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

