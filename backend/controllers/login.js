import { getSupabaseClient } from '../clients/supabaseClient.js';
import { ErrorResponse } from '../utils/errorResponse.js';

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return ErrorResponse.badRequest('Email and password are required').send(res);
    }

    const supabase = getSupabaseClient();

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData?.user || !authData?.session) {
      return ErrorResponse.unauthorized('Invalid email or password').send(res);
    }

    const userId = authData.user.id;

    // Fetch roles for this user (RLS allows user to read own roles)
    const { data: rolesRows, error: rolesError } = await supabase
      .from('profile_roles')
      .select('role')
      .eq('profile_id', userId);

    if (rolesError) {
      console.error('Roles fetch error:', rolesError);
      return ErrorResponse.internalServerError('Failed to fetch user roles').send(res);
    }

    const roles = Array.isArray(rolesRows) ? rolesRows.map(r => r.role) : [];

    // If a specific role is requested (e.g., teacher login), verify it
    if (role && !roles.includes(role)) {
      return ErrorResponse.forbidden(`You don't have ${role} access`).send(res);
    }

    // Fetch profile (use name field per current schema)
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Not fatal; continue with auth user data
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: userId,
        email: profileRow?.email || authData.user.email,
        name: profileRow?.name || null,
        role: role || (roles[0] || 'student'),
        roles
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};

export { login };
