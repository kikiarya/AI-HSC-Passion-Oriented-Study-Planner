import { getSupabaseClient } from '../clients/supabaseClient.js';
import { ErrorResponse } from '../utils/errorResponse.js';

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user; // from verifyAuth middleware

    if (!user) return ErrorResponse.unauthorized('Not authenticated').send(res);
    if (!currentPassword || !newPassword)
      return ErrorResponse.badRequest('Both current and new password required').send(res);
    if (newPassword.length < 6)
      return ErrorResponse.badRequest('Password must be at least 6 chars').send(res);

    const supabase = getSupabaseClient();

    // 1) verify old password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError)
      return ErrorResponse.unauthorized('Current password is incorrect').send(res);

    // 2) update password using logged-in user's session
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError)
      return ErrorResponse.internalServerError('Failed to change password').send(res);

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return ErrorResponse.internalServerError(err.message).send(res);
  }
};
