import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function StudentLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      // Import auth service dynamically
      const authService = (await import('../services/authService.js')).default
      
      // Call login API with student role
      await authService.login(formData.email, formData.password, 'student')
      
      // Navigate to student dashboard on success
      navigate('/student/dashboard')
      
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="logo-auth" onClick={() => navigate('/')}>
            <span className="logo-icon">⚡</span>
            <span className="logo-text">HSC Power</span>
          </div>
          <h1>Student Login</h1>
          <p>Welcome back! Please login to your student account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="student@school.edu.au"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/recover'); }} className="link">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register/student'); }} className="link">
              Register here
            </a>
          </p>
          <p className="switch-role">
            Are you a teacher?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/teacher'); }} className="link">
              Teacher Login
            </a>
          </p>
          <p className="switch-role">
            Are you a parent?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/parent'); }} className="link">
              Parent Login
            </a>
          </p>
        </div>

        <div className="back-home">
          <button onClick={() => navigate('/')} className="btn-back">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentLogin

