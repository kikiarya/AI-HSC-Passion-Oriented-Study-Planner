import { useState } from 'react'

function ResetPasswordModal({ user, onClose, onReset }) {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
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
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await onReset(formData.newPassword)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reset Password</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '1.5rem', color: '#718096' }}>
            Reset password for <strong>{user.email}</strong>
          </p>

          {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="create-user-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password *</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                minLength={8}
              />
              <small style={{ color: '#718096', fontSize: '0.875rem' }}>
                Minimum 8 characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordModal


