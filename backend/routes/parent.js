import express from 'express';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { getParentChildren } from '../controllers/parent/children.js';
import { getChildWeeklyReport } from '../controllers/parent/weeklyReport.js';

const router = express.Router();

// All parent routes require authentication and parent role
router.use(verifyAuth);
router.use(requireRole(['parent']));

// ===================
// Children Routes
// ===================

// GET /api/parent/children - Get all children associated with parent
router.get('/children', getParentChildren);

// ===================
// Weekly Report Routes
// ===================

// GET /api/parent/children/:student_id/weekly-report - Get child's weekly report
router.get('/children/:student_id/weekly-report', getChildWeeklyReport);

export { router as parentRoutes };

