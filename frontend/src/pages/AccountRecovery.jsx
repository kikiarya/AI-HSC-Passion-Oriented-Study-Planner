import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function AccountRecovery() {
  const navigate = useNavigate()
  const [accountType, setAccountType] = useState('student')
  const [step, setStep] = useState(1) // 1: email, 2: verification code, 3: new password
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!formData.email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    // TODO: Implement actual API call to send verification code
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Verification code sent to your email!')
      setStep(2)
      
    } catch (err) {
      setError('Email not found or error sending verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!formData.verificationCode) {
      setError('Please enter the verification code')
      setLoading(false)
      return
    }

    // TODO: Implement actual API call to verify code
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Code verified! Please set a new password.')
      setStep(3)
      
    } catch (err) {
      setError('Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    // TODO: Implement actual API call to reset password
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Password reset successful!')
      setTimeout(() => {
        navigate(`/login/${accountType}`)
      }, 2000)
      
    } catch (err) {
      setError('Error resetting password')
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
          <h1>Account Recovery</h1>
          <p>Reset your password to regain access to your account</p>
        </div>

        {/* Account Type Selector */}
        <div className="account-type-selector">
          <button
            className={`type-btn ${accountType === 'student' ? 'active' : ''}`}
            onClick={() => setAccountType('student')}
          >
            Student Account
          </button>
          <button
            className={`type-btn ${accountType === 'teacher' ? 'active' : ''}`}
            onClick={() => setAccountType('teacher')}
          >
            Teacher Account
          </button>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
            <div className="step-circle">1</div>
            <div className="step-label">Email</div>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
            <div className="step-circle">2</div>
            <div className="step-label">Verify</div>
          </div>
          <div className="step-line"></div>
          <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <div className="step-label">Reset</div>
          </div>
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <form className="auth-form" onSubmit={handleEmailSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={accountType === 'student' ? 'student@school.edu.au' : 'teacher@school.edu.au'}
                required
              />
              <small className="form-hint">
                Enter the email associated with your {accountType} account
              </small>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: Verification Code */}
        {step === 2 && (
          <form className="auth-form" onSubmit={handleCodeSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleChange}
                placeholder="Enter the 6-digit code"
                maxLength="6"
                required
                className="verification-code-input"
              />
              <small className="form-hint">
                Check your email ({formData.email}) for the verification code
              </small>
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="resend-link">
              <a href="#" onClick={(e) => { e.preventDefault(); handleEmailSubmit(e); }} className="link">
                Resend verification code
              </a>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <small className="form-hint">Must be at least 8 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
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
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/login/${accountType}`); }} className="link">
              Back to login
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

export default AccountRecovery

