import { Navigate, useLocation } from 'react-router-dom'
import authService from '../services/authService.js'

/**
 * ProtectedRoute component to protect routes from unauthorized access
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.requiredRole - Required role to access the route (optional)
 * @param {string} props.redirectTo - Path to redirect to if unauthorized (default: '/login/student')
 */
function ProtectedRoute({ children, requiredRole, redirectTo = '/login/student' }) {
  const location = useLocation()

  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    // Redirect to login with the return URL
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // If a specific role is required, check if user has it
  if (requiredRole && !authService.hasRole(requiredRole)) {
    // Redirect to appropriate page based on user's role
    const user = authService.getCurrentUser()
    if (user) {
      // Redirect to the user's role-specific dashboard
      const roleDashboards = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        parent: '/parent/dashboard',
        admin: '/admin/dashboard'
      }
      const dashboard = roleDashboards[user.role] || '/'
      return <Navigate to={dashboard} replace />
    }
    return <Navigate to="/" replace />
  }

  // User is authenticated and has required role (if specified)
  return children
}

export default ProtectedRoute

