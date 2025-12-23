import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function ParentLogin() {
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
      
      // Call login API with parent role
      await authService.login(formData.email, formData.password, 'parent')
      
      // Navigate to parent dashboard on success
      navigate('/parent/dashboard')
      
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
          <h1>Parent Login</h1>
          <p>Welcome back! Please login to your parent account</p>
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
              placeholder="parent@example.com"
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
          <div className="info-box">
            <p className="info-title">📌 Note for Parents</p>
            <p className="info-text">
              Connect with your child's academic progress and get personalized insights 
              about their learning journey.
            </p>
          </div>
          <p className="switch-role">
            Are you a student?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/student'); }} className="link">
              Student Login
            </a>
          </p>
          <p className="switch-role">
            Are you a teacher?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/teacher'); }} className="link">
              Teacher Login
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

export default ParentLogin

