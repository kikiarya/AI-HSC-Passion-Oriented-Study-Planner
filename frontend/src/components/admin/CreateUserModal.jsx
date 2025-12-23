import { useState } from 'react'

function CreateUserModal({ userType, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    classCode: '' // For students only
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
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      }

      if (userType === 'student') {
        userData.classCode = formData.classCode
      }

      await onCreate(userData)
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        classCode: ''
      })
    } catch (err) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create {userType === 'student' ? 'Student' : 'Teacher'} Account</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} className="create-user-form">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <small style={{ color: '#718096', fontSize: '0.875rem' }}>
                Minimum 8 characters
              </small>
            </div>

            {userType === 'student' && (
              <div className="form-group">
                <label htmlFor="classCode">Class Code (Optional)</label>
                <input
                  type="text"
                  id="classCode"
                  name="classCode"
                  value={formData.classCode}
                  onChange={handleChange}
                  style={{ textTransform: 'uppercase' }}
                />
                <small style={{ color: '#718096', fontSize: '0.875rem' }}>
                  If provided, the student will be automatically enrolled in this class
                </small>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Creating...' : `Create ${userType === 'student' ? 'Student' : 'Teacher'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateUserModal

