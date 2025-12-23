import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'
import CreateUserModal from './CreateUserModal'
import EditUserModal from './EditUserModal'
import ResetPasswordModal from './ResetPasswordModal'

function TeachersView() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Loading teachers from API...')
      const response = await adminApi.getTeachers()
      console.log('Teachers API response:', response)
      const teachersList = response.teachers || []
      console.log(`Loaded ${teachersList.length} teachers`)
      setTeachers(teachersList)
    } catch (err) {
      const errorMsg = err.message || 'Failed to load teachers'
      setError(errorMsg)
      console.error('Error loading teachers:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeacher = async (teacherData) => {
    try {
      await adminApi.createTeacher(teacherData)
      setShowCreateModal(false)
      await loadTeachers() // Reload the list
      return true
    } catch (err) {
      throw err
    }
  }

  const handleEdit = (teacher) => {
    setSelectedUser(teacher)
    setShowEditModal(true)
  }

  const handleUpdate = async (userData) => {
    try {
      await adminApi.updateUser(selectedUser.id, userData)
      await loadTeachers()
      return true
    } catch (err) {
      throw err
    }
  }

  const handleResetPassword = (teacher) => {
    setSelectedUser(teacher)
    setShowResetPasswordModal(true)
  }

  const handleResetPasswordSubmit = async (newPassword) => {
    try {
      await adminApi.resetPassword(selectedUser.id, newPassword)
      await loadTeachers()
      return true
    } catch (err) {
      throw err
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this teacher account? This action cannot be undone.')) {
      return
    }

    try {
      setError('')
      await adminApi.deleteUser(userId)
      await loadTeachers()
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete teacher'
      setError(errorMsg)
      alert(errorMsg)
    }
  }

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading teachers...</p>
      </div>
    )
  }

  return (
    <div className="admin-users-view">
      <div className="admin-header">
        <div>
          <h2>Teacher Accounts</h2>
          <p className="admin-subtitle">Manage all teacher accounts in the system</p>
        </div>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          ➕ Create Teacher
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div className="admin-filters">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-results">
          {filteredTeachers.length} of {teachers.length} teachers
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                  {teachers.length === 0 ? 'No teachers found. Create your first teacher account.' : 'No teachers match your search.'}
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>{teacher.name || 'N/A'}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-action"
                        onClick={() => handleEdit(teacher)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action"
                        onClick={() => handleResetPassword(teacher)}
                        title="Reset Password"
                      >
                        🔑
                      </button>
                      <button
                        className="btn-action btn-danger"
                        onClick={() => handleDelete(teacher.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateUserModal
          userType="teacher"
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTeacher}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onUpdate={handleUpdate}
        />
      )}

      {showResetPasswordModal && selectedUser && (
        <ResetPasswordModal
          user={selectedUser}
          onClose={() => {
            setShowResetPasswordModal(false)
            setSelectedUser(null)
          }}
          onReset={handleResetPasswordSubmit}
        />
      )}
    </div>
  )
}

export default TeachersView

