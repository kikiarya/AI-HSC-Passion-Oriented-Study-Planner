import express from 'express';
import { verifyAuth, requireRole } from '../middleware/auth.js';
import { 
  getTeacherClasses, 
  getClassDetails, 
  getClassStudents, 
  getClassAnalytics,
  createClass,
  enrollStudent,
  removeStudent
} from '../controllers/teacher/classes.js';
import { getOverallAnalytics } from '../controllers/teacher/analytics.js';
import { 
  getTeacherAssignments, 
  getAssignmentDetails, 
  createAssignment, 
  updateAssignment, 
  deleteAssignment, 
  publishAssignment 
} from '../controllers/teacher/assignments.js';
import { 
  getTeacherStudents, 
  getStudentDetails, 
  updateStudentNotes,
  getStudentGrades,
  getAllStudents
} from '../controllers/teacher/students.js';
import { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from '../controllers/teacher/announcements.js';
import {
  getAssignmentSubmissions,
  getSubmissionDetail,
  gradeSubmission,
  updateSubmissionFeedback,
  getGradingSummary
} from '../controllers/teacher/submissions.js';
import {
  generateRubric,
  summarizeContent,
  autoGradeSubmission,
  analyzeClassPerformance,
  generateAssignment
} from '../controllers/teacher/aiFeatures.js';
import multer from 'multer';
import {
  listClassModules,
  createClassModule,
  updateModule,
  deleteModule,
  createModuleItem,
  updateModuleItem,
  deleteModuleItem,
  uploadModuleItemFile,
  summarizeModuleItemFile
} from '../controllers/teacher/modules.js';

const router = express.Router();

// All teacher routes require authentication and teacher role
router.use(verifyAuth);
router.use(requireRole(['teacher', 'admin']));

// ===================
// Analytics Routes (Must be before parameter routes)
// ===================

// GET /api/teacher/analytics - Get overall analytics for all classes
router.get('/analytics', getOverallAnalytics);

// ===================
// Classes Routes
// ===================

// GET /api/teacher/classes - Get all teacher's classes
router.get('/classes', getTeacherClasses);

// POST /api/teacher/classes - Create a new class
router.post('/classes', createClass);

// GET /api/teacher/classes/:id - Get class details
router.get('/classes/:id', getClassDetails);

// GET /api/teacher/classes/:id/students - Get class roster
router.get('/classes/:id/students', getClassStudents);

// GET /api/teacher/classes/:id/analytics - Get class analytics
router.get('/classes/:id/analytics', getClassAnalytics);

// POST /api/teacher/classes/:id/enroll - Enroll a student in a class
router.post('/classes/:id/enroll', enrollStudent);

// DELETE /api/teacher/classes/:id/students/:studentId - Remove a student from a class
router.delete('/classes/:id/students/:studentId', removeStudent);

// ===================
// Modules Routes (must come after classes routes but before generic params)
// ===================

const upload = multer({ storage: multer.memoryStorage() });

// List modules for a class
router.get('/classes/:classId/modules', listClassModules);
// Create module for a class
router.post('/classes/:classId/modules', createClassModule);
// Update/Delete a module
router.put('/modules/:moduleId', updateModule);
router.delete('/modules/:moduleId', deleteModule);
// Items CRUD
router.post('/modules/:moduleId/items', createModuleItem);
router.put('/modules/:moduleId/items/:itemId', updateModuleItem);
router.delete('/modules/:moduleId/items/:itemId', deleteModuleItem);
// File upload for item
router.post('/modules/:moduleId/items/:itemId/file', upload.single('file'), uploadModuleItemFile);
// AI summarize a PDF file item
router.post('/modules/:moduleId/items/:itemId/summarize', summarizeModuleItemFile);

// ===================
// Assignments Routes
// ===================

// GET /api/teacher/assignments - Get all assignments
router.get('/assignments', getTeacherAssignments);

// POST /api/teacher/assignments - Create assignment
router.post('/assignments', createAssignment);

// IMPORTANT: More specific routes must come BEFORE generic parameter routes
// GET /api/teacher/assignments/:assignmentId/submissions - Get submissions (must be before /:id)
router.get('/assignments/:assignmentId/submissions', getAssignmentSubmissions);

// PUT /api/teacher/assignments/:assignmentId/submissions/:submissionId/grade - Grade a submission (must be before /:id)
router.put('/assignments/:assignmentId/submissions/:submissionId/grade', gradeSubmission);

// GET /api/teacher/assignments/:assignmentId/grading-summary - Get grading summary (must be before /:id)
router.get('/assignments/:assignmentId/grading-summary', getGradingSummary);

// POST /api/teacher/assignments/:id/publish - Publish assignment (must be before /:id)
router.post('/assignments/:id/publish', publishAssignment);

// GET /api/teacher/assignments/:id - Get assignment details (generic route comes last)
router.get('/assignments/:id', getAssignmentDetails);

// PUT /api/teacher/assignments/:id - Update assignment
router.put('/assignments/:id', updateAssignment);

// DELETE /api/teacher/assignments/:id - Delete assignment
router.delete('/assignments/:id', deleteAssignment);

// ===================
// Students Routes
// ===================

// GET /api/teacher/students/all-students - Get all students in system (must be before /:id)
router.get('/students/all-students', getAllStudents);

// GET /api/teacher/students - Get all students
router.get('/students', getTeacherStudents);

// GET /api/teacher/students/:id/grades - Get student grades (must be before /:id)
router.get('/students/:id/grades', getStudentGrades);

// GET /api/teacher/students/:id - Get student details
router.get('/students/:id', getStudentDetails);

// PUT /api/teacher/students/:id/notes - Save student notes
router.put('/students/:id/notes', updateStudentNotes);

// ===================
// Announcements Routes
// ===================

// GET /api/teacher/announcements - Get announcements
router.get('/announcements', getAnnouncements);

// POST /api/teacher/announcements - Create announcement
router.post('/announcements', createAnnouncement);

// PUT /api/teacher/announcements/:id - Update announcement
router.put('/announcements/:id', updateAnnouncement);

// DELETE /api/teacher/announcements/:id - Delete announcement
router.delete('/announcements/:id', deleteAnnouncement);

// ===================
// Submissions & Grading Routes
// ===================
// Note: /assignments/:assignmentId/submissions routes are already defined above in Assignments Routes section
// to ensure they come before the generic /assignments/:id route

// GET /api/teacher/submissions/:submissionId - Get submission details
router.get('/submissions/:submissionId', getSubmissionDetail);

// PUT /api/teacher/submissions/:submissionId/feedback - Update submission feedback
router.put('/submissions/:submissionId/feedback', updateSubmissionFeedback);

// ===================
// AI Features Routes
// ===================

// POST /api/teacher/ai/auto-grade - AI auto-grade submission
router.post('/ai/auto-grade', autoGradeSubmission);

// POST /api/teacher/ai/generate-rubric - Generate rubric with AI
router.post('/ai/generate-rubric', generateRubric);

// POST /api/teacher/ai/generate-assignment - Generate assignment with AI
router.post('/ai/generate-assignment', generateAssignment);

// POST /api/teacher/ai/analyze-class - Analyze class performance
router.post('/ai/analyze-class', analyzeClassPerformance);

// POST /api/teacher/ai/summarize - Summarize content
router.post('/ai/summarize', summarizeContent);

export { router as teacherRoutes };


