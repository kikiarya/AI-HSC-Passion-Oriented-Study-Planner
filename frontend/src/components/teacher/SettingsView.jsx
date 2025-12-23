import { useState, useEffect } from 'react'
import authService from '../../services/authService'
import './SettingsView.css'

function SettingsView({ teacherProfile: initialProfile }) {
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (initialProfile) {
      setProfileData({
        first_name: initialProfile.first_name || '',
        last_name: initialProfile.last_name || '',
        email: initialProfile.email || ''
      })
    }
  }, [initialProfile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await authService.updateProfile(profileData)
      
      // Update localStorage with new profile data
      const currentUser = authService.getCurrentUser()
      if (currentUser && response) {
        const updatedUser = {
          ...currentUser,
          first_name: response.first_name,
          last_name: response.last_name,
          avatar: response.avatar
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Failed to update profile:', error)
      setMessage({ type: 'error', text: error.message || 'Update failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = () => {
    alert('Password change feature coming soon')
  }

  return (
    <div className="settings-container">
      {/* Profile Settings */}
      <section className="settings-section">
        <h3>Profile Settings</h3>
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="first_name"
              value={profileData.first_name}
              onChange={handleChange}
              placeholder="Enter your first name"
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="last_name"
              value={profileData.last_name}
              onChange={handleChange}
              placeholder="Enter your last name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled
            />
            <small style={{ color: '#718096' }}>Email address cannot be changed</small>
          </div>

          <div className="form-group">
            <label>Teacher ID</label>
            <input
              type="text"
              value={initialProfile?.id || ''}
              disabled
            />
            <small style={{ color: '#718096' }}>Teacher ID is read-only</small>
          </div>

          <button 
            type="submit" 
            className="btn-save"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>

      {/* Notification Preferences */}
      <section className="settings-section">
        <h3>Notification Preferences</h3>
        <div className="settings-options">
          <div className="option-item">
            <div>
              <h4>Email Notifications</h4>
              <p>Receive email notifications for submissions and grading</p>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
            </label>
          </div>

          <div className="option-item">
            <div>
              <h4>Push Notifications</h4>
              <p>Receive browser push notifications</p>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" />
            </label>
          </div>
        </div>
      </section>

      {/* Teaching Preferences */}
      <section className="settings-section">
        <h3>Teaching Preferences</h3>
        <div className="settings-options">
          <div className="option-item">
            <div>
              <h4>AI Assistance</h4>
              <p>Enable AI features for grading and content generation</p>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
            </label>
          </div>

          <div className="option-item">
            <div>
              <h4>Auto-Publish Grades</h4>
              <p>Automatically publish grades to students after grading</p>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" />
            </label>
          </div>

          <div className="option-item">
            <div>
              <h4>Accept Late Submissions</h4>
              <p>Allow students to submit assignments after the due date</p>
            </div>
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
            </label>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="settings-section">
        <h3>Security Settings</h3>
        <div className="security-info">
          <p>Last login: {new Date().toLocaleString()}</p>
        </div>
        <button className="btn-secondary-action" onClick={handlePasswordChange}>
          Change Password
        </button>
      </section>

      {/* Account Management */}
      <section className="settings-section danger-zone">
        <h3>Account Management</h3>
        <p>To deactivate or delete your account, please contact an administrator</p>
      </section>
    </div>
  )
}

export default SettingsView
