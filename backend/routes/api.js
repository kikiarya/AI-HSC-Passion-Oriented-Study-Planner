import express from 'express';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { getTertiaryCoursesSubjectsMapping } from '../controllers/tertiaryCoursesSubjectsMapping.js';
import { updateProfile } from "../controllers/profile.js";
import { getSupabaseClient } from '../clients/supabaseClient.js';

const router = express.Router();

// Example route
router.get('/examples', (req, res) => {
  res.json({ message: 'Example API route' });
});

// Get current user profile - requires authentication
router.get('/profile', verifyAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, avatar, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json({ data });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch profile' });
  }
});

// Update profile
router.put('/profile', verifyAuth, updateProfile);

// Role-based route example - only students can access
router.get('/student-data', verifyAuth, requireRole(['student']), (req, res) => {
  res.json({ 
    message: 'Student-only data',
    user: req.user,
    roles: req.userRoles
  });
});

// Role-based route example - only teachers can access
router.get('/teacher-data', verifyAuth, requireRole(['teacher']), (req, res) => {
  res.json({ 
    message: 'Teacher-only data',
    user: req.user,
    roles: req.userRoles
  });
});

// Public endpoint - Get tertiary courses subjects mapping
router.get('/tertiary-courses-subjects-mapping', getTertiaryCoursesSubjectsMapping);

// Get HSC Subjects - requires authentication
router.get('/hsc-subjects', verifyAuth, async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('hsc_subjects')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching HSC subjects:', error);
      return res.status(500).json({ error: 'Failed to fetch HSC subjects' });
    }

    return res.json({ data: data || [] });
  } catch (err) {
    console.error('Get HSC subjects error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch HSC subjects' });
  }
});

export default router;
