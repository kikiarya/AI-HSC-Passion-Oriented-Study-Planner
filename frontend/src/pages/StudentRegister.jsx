import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function StudentRegister() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    classCode: ''
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
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.password || !formData.confirmPassword || !formData.classCode) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (formData.classCode.length < 6) {
      setError('Please enter a valid class code')
      setLoading(false)
      return
    }

    try {
      // Import auth service dynamically
      const authService = (await import('../services/authService.js')).default
      
      // Call signup API with student role
      await authService.signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: 'student',
        classCode: formData.classCode
      })
      
      // Show success message and navigate to login
      alert('Registration successful! You have been enrolled in your class. Please login to continue.')
      navigate('/login/student')
      
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
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
          <h1>Student Registration</h1>
          <p>Create your account and start your HSC journey</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Smith"
                required
              />
            </div>
          </div>

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
            <label htmlFor="classCode">Class Code</label>
            <input
              type="text"
              id="classCode"
              name="classCode"
              value={formData.classCode}
              onChange={handleChange}
              placeholder="Enter the code provided by your teacher"
              required
              className="class-code-input"
            />
            <small className="form-hint">
              Your teacher will provide this code. It will assign you to your class.
            </small>
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
            <small className="form-hint">Must be at least 8 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login/student'); }} className="link">
              Login here
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

export default StudentRegister

