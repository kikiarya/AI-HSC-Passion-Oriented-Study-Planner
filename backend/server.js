import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { authRoutes } from './routes/auth.js';
import { aiRoutes } from './routes/aiAgent.js';
import { teacherRoutes } from './routes/teacher.js';
import { studentRoutes } from './routes/student.js';
import { adminRoutes } from './routes/admin.js';
import { parentRoutes } from './routes/parent.js';
import { logger } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',  // Development frontend (Vite)
    'http://localhost:3000',  // Backend
    'http://localhost',       // Production frontend (Nginx on port 80)
    'http://localhost:80'     // Production frontend (explicit port)
  ],
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);


app.use(cors({
  origin: [
    'http://localhost:5173',  // 本地 Vite 开发环境
    'https://ai-hsc-passion-oriented-study-plann.vercel.app'  // 线上前端（Vercel）
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
*/

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
    ];

    // 允许所有 vercel.app 子域名
    if (
      !origin ||
      allowed.includes(origin) ||
      /\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));



// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to HSC Power API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        login: '/api/auth/login',
        signup: '/api/auth/signup',
        logout: '/api/auth/logout'
      },
      teacher: {
        classes: '/api/teacher/classes',
        assignments: '/api/teacher/assignments',
        students: '/api/teacher/students',
        announcements: '/api/teacher/announcements'
      },
      aiAgent: {
        courseRecommendation: '/api/ai-agent/course-recommendation',
        careerPathway: '/api/ai-agent/career-pathway',
        weeklyReport: '/api/ai-agent/weekly-report'
      },
      teacher: {
        classes: '/api/teacher/classes',
        assignments: '/api/teacher/assignments',
        students: '/api/teacher/students',
        ai: '/api/teacher/ai/*'
      },
      student: {
        studyPlan: '/api/student/study-plan/*',
        weeklyReport: '/api/student/weekly-report'
      },
      admin: {
        students: '/api/admin/students',
        teachers: '/api/admin/teachers',
        users: '/api/admin/users/*'
      },
      tertiaryCoursesSubjectsMapping: '/api/tertiary-courses-subjects-mapping',
      examples: '/api/examples'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'HSC Power Server is running' });
});

// API Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai-agent', aiRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/parent', parentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HSC Power Server is running on http://localhost:${PORT}`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
});

export default app;

