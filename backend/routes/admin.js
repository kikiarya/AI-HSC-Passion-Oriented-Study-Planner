import express from 'express';
const router = express.Router();
import { verifyAuth, requireRole } from '../middleware/auth.js';
import {
  getStudents,
  getTeachers,
  createStudent,
  createTeacher,
  updateUser,
  deleteUser,
  resetUserPassword,
} from '../controllers/admin.js';

// All admin routes require authentication and admin role
router.use(verifyAuth);
router.use(requireRole(['admin']));

// Student management
router.get('/students', getStudents);
router.post('/students', createStudent);

// Teacher management
router.get('/teachers', getTeachers);
router.post('/teachers', createTeacher);

// User management
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.post('/users/reset-password', resetUserPassword);

export { router as adminRoutes };

