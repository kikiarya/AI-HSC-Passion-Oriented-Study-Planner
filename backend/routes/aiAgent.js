import express from 'express';
import { createCourseRecommendation } from '../controllers/course.js';
import { createCareerPathway } from '../controllers/career.js';
import { createWeeklyReport } from '../controllers/weeklyReport.js';

const router = express.Router();

// POST /api/ai-agent/course-recommendation
router.post('/course-recommendation', createCourseRecommendation);

// POST /api/ai-agent/career-pathway
router.post('/career-pathway', createCareerPathway);

// POST /api/ai-agent/weekly-report
router.post('/weekly-report', createWeeklyReport);

export {
  router as aiRoutes
};


