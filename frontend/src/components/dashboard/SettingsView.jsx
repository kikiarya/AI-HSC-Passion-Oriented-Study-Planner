import { useState, useEffect } from 'react'
import authService from '../../services/authService'

function SettingsView({ studentData, userProfile, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || ''
      })
    }
  }, [userProfile])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name
      }

      const response = await authService.updateProfile(updateData)
      
      if (response) {
        onProfileUpdate(response)
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        
        // Update localStorage
        const currentUser = authService.getCurrentUser()
        if (currentUser) {
          localStorage.setItem('user', JSON.stringify({
            ...currentUser,
            first_name: response.first_name,
            last_name: response.last_name
          }))
        }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordMessage({ type: '', text: '' })

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All fields are required' })
      setPasswordLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      setPasswordLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      setPasswordLoading(false)
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password must be different from current password' })
      setPasswordLoading(false)
      return
    }

    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword)
      
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' })
      
      // Clear form after 2 seconds
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setPasswordMessage({ type: '', text: '' })
      }, 2000)
    } catch (error) {
      console.error('Password change error:', error)
      setPasswordMessage({ type: 'error', text: error.message || 'Failed to change password' })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="settings-container">
      <section className="settings-section">
        <h3>Profile Settings</h3>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        <div className="settings-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>First Name</label>
              <input 
                type="text" 
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input 
                type="text" 
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={userProfile?.email || studentData.email} 
                disabled 
              />
            </div>
            <div className="form-group">
              <label>Student ID</label>
              <input 
                type="text" 
                value={userProfile?.id?.slice(0, 8) || studentData.studentId} 
                disabled 
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </section>

      <section className="settings-section">
        <h3>Preferences</h3>
        <div className="settings-options">
          <div className="option-item">
            <div>
              <h4>Email Notifications</h4>
              <p>Receive updates about assignments and grades</p>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="option-item">
            <div>
              <h4>AI Recommendations</h4>
              <p>Get personalized study and career suggestions</p>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h3>Security</h3>
        <button 
          className="btn-secondary-action"
          onClick={() => setShowPasswordModal(true)}
        >
          Change Password
        </button>
      </section>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Change Password</h3>
            {passwordMessage.text && (
              <div className={`message ${passwordMessage.type}`}>
                {passwordMessage.text}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password (min 6 characters)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordMessage({ type: '', text: '' })
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-confirm"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SettingsView

