import { useState, useEffect } from 'react'

function EditUserModal({ user, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      // Parse name if it exists
      const nameParts = (user.name || '').split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      setFormData({
        firstName,
        lastName,
        email: user.email || ''
      })
    }
  }, [user])

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
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      await onUpdate({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit User</h3>
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

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditUserModal


