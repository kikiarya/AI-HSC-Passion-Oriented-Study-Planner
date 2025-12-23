import express from 'express';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import {
  generateStudyPlan,
  saveStudyPlanPreferences,
  getStudyPlanPreferences
} from '../controllers/student/studyPlanner.js';
import { getStudentAnnouncements } from '../controllers/student/announcements.js';
import { getStudentClasses } from '../controllers/student/classes.js';
import { getHSCSubjects } from '../controllers/student/hscSubjects.js';
import { getStudentAssignments, getAssignmentDetail, submitAssignment } from '../controllers/student/assignments.js';
import { getClassModulesForStudent, getModuleDetailForStudent } from '../controllers/student/modules.js';
import { getStudentGrades } from '../controllers/student/grades.js';
import { 
  addSelectedSubject, 
  getSelectedSubjects, 
  deleteSelectedSubject 
} from '../controllers/student/selectedSubjects.js';
import { sendChatMessage } from '../controllers/student/chat.js';
import { 
  generatePracticeQuestions,
  getPracticeStats 
} from '../controllers/student/practiceQuestions.js';
import { 
  getReviewQuestions,
  getReviewStats 
} from '../controllers/student/reviewQuestions.js';
import { 
  getPracticeQuestions,
  submitPracticeAnswer 
} from '../controllers/student/practiceAnswers.js';
import { analyzeKnowledgeGaps, getKnowledgeGapsStats } from '../controllers/student/knowledgeGaps.js';

const router = express.Router();

// All student routes require authentication and student role
router.use(verifyAuth);
router.use(requireRole(['student']));

// ===================
// Study Plan Routes
// ===================

// POST /api/student/study-plan/generate - Generate AI study plan
router.post('/study-plan/generate', generateStudyPlan);

// POST /api/student/study-plan/preferences - Save study preferences
router.post('/study-plan/preferences', saveStudyPlanPreferences);

// GET /api/student/study-plan/preferences - Get study preferences
router.get('/study-plan/preferences', getStudyPlanPreferences);

// ===================
// Announcements Routes
// ===================

// GET /api/student/announcements - Get all announcements for student's enrolled classes
router.get('/announcements', getStudentAnnouncements);

// ===================
// Classes Routes
// ===================

// GET /api/student/classes - Get all classes the student is enrolled in
router.get('/classes', getStudentClasses);

// ===================
// Modules Routes
// ===================
router.get('/classes/:classId/modules', getClassModulesForStudent);
router.get('/modules/:moduleId', getModuleDetailForStudent);

// ===================
// HSC Subjects Routes
// ===================

// GET /api/student/hsc-subjects - Get all HSC subjects
router.get('/hsc-subjects', getHSCSubjects);

// ===================
// Assignments Routes
// ===================

// GET /api/student/assignments - Get all assignments for student's enrolled classes
router.get('/assignments', getStudentAssignments);

// POST /api/student/assignments/:id/submit - Submit an assignment
router.post('/assignments/:id/submit', submitAssignment);

// GET /api/student/assignments/:id - Get assignment details
router.get('/assignments/:id', getAssignmentDetail);

// ===================
// Grades Routes
// ===================

// GET /api/student/grades - Get all grades for student
router.get('/grades', getStudentGrades);

// ===================
// Selected Subjects Routes
// ===================

// POST /api/student/selected-subjects - Add a single selected HSC subject
router.post('/selected-subjects', addSelectedSubject);

// GET /api/student/selected-subjects - Get student's selected HSC subjects
router.get('/selected-subjects', getSelectedSubjects);

// DELETE /api/student/selected-subjects/:id - Delete a specific selected subject
router.delete('/selected-subjects/:id', deleteSelectedSubject);

// ===================
// Chat Routes
// ===================

// POST /api/student/chat - Send message to AI chat
router.post('/chat', sendChatMessage);

// ===================
// Practice Questions Routes
// ===================

// POST /api/student/practice-questions/generate - Generate AI practice questions
router.post('/practice-questions/generate', generatePracticeQuestions);

// GET /api/student/practice-questions/stats - Get practice question stats
router.get('/practice-questions/stats', getPracticeStats);

// ===================
// Review Questions Routes
// ===================

// GET /api/student/review-questions - Get practice questions for review
router.get('/review-questions', getReviewQuestions);

// GET /api/student/review-questions/stats - Get review statistics
router.get('/review-questions/stats', getReviewStats);

// ===================
// Practice Answers Routes
// ===================

// GET /api/student/practice-answers/questions - Get all practice questions
router.get('/practice-answers/questions', getPracticeQuestions);

// POST /api/student/practice-answers/submit - Submit answer
router.post('/practice-answers/submit', submitPracticeAnswer);


// ===================
// Knowledge Gaps Routes
// ===================

// POST /api/student/knowledge-gaps/analyze - Analyze knowledge gaps
router.post('/knowledge-gaps/analyze', analyzeKnowledgeGaps);

// GET /api/student/knowledge-gaps/stats - Get knowledge gaps statistics
router.get('/knowledge-gaps/stats', getKnowledgeGapsStats);

export { router as studentRoutes };

