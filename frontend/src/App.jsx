import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import StudentLogin from './pages/StudentLogin'
import StudentRegister from './pages/StudentRegister'
import TeacherLogin from './pages/TeacherLogin'
import ParentLogin from './pages/ParentLogin'
import AccountRecovery from './pages/AccountRecovery'
import StudentDashboard from './pages/StudentDashboard'
import CareerResultPage from './pages/CareerResultPage'
import TeacherDashboard from './pages/TeacherDashboard'
import ParentDashboard from './pages/ParentDashboard'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/login/teacher" element={<TeacherLogin />} />
        <Route path="/login/parent" element={<ParentLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/register/student" element={<StudentRegister />} />
        <Route path="/recover" element={<AccountRecovery />} />
        <Route path="/student/career-pathway" element={<CareerResultPage />} />
        <Route path="/student/:tab" element={<StudentDashboard />} />
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute requiredRole="teacher" redirectTo="/login/teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/classes" 
          element={
            <ProtectedRoute requiredRole="teacher" redirectTo="/login/teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/assignments" 
          element={
            <ProtectedRoute requiredRole="teacher" redirectTo="/login/teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/students" 
          element={
            <ProtectedRoute requiredRole="teacher" redirectTo="/login/teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/students/:studentId/grades" 
          element={
            <ProtectedRoute requiredRole="teacher" redirectTo="/login/teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/analytics" 
          element={
            <ProtectedRoute requiredRole="teacher" redirectTo="/login/teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/announcements" 
          element={
            <ProtectedRoute requiredRole="teacher" redirectTo="/login/teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/settings" 
          element={
            <ProtectedRoute requiredRole="teacher" redirectTo="/login/teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/parent/dashboard" 
          element={
            <ProtectedRoute requiredRole="parent" redirectTo="/login/parent">
              <ParentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/login/admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/students" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/login/admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/teachers" 
          element={
            <ProtectedRoute requiredRole="admin" redirectTo="/login/admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
