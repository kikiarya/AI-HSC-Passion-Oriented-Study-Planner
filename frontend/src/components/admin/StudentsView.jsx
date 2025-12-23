import { useState, useEffect } from 'react'
import adminApi from '../../services/adminApi'
import CreateUserModal from './CreateUserModal'
import EditUserModal from './EditUserModal'
import ResetPasswordModal from './ResetPasswordModal'

function StudentsView() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Loading students from API...')
      const response = await adminApi.getStudents()
      console.log('Students API response:', response)
      const studentsList = response.students || []
      console.log(`Loaded ${studentsList.length} students`)
      setStudents(studentsList)
    } catch (err) {
      const errorMsg = err.message || 'Failed to load students'
      setError(errorMsg)
      console.error('Error loading students:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStudent = async (studentData) => {
    try {
      await adminApi.createStudent(studentData)
      setShowCreateModal(false)
      await loadStudents() // Reload the list
      return true
    } catch (err) {
      throw err
    }
  }

  const handleEdit = (student) => {
    setSelectedUser(student)
    setShowEditModal(true)
  }

  const handleUpdate = async (userData) => {
    try {
      await adminApi.updateUser(selectedUser.id, userData)
      await loadStudents()
      return true
    } catch (err) {
      throw err
    }
  }

  const handleResetPassword = (student) => {
    setSelectedUser(student)
    setShowResetPasswordModal(true)
  }

  const handleResetPasswordSubmit = async (newPassword) => {
    try {
      await adminApi.resetPassword(selectedUser.id, newPassword)
      await loadStudents()
      return true
    } catch (err) {
      throw err
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this student account? This action cannot be undone.')) {
      return
    }

    try {
      setError('')
      await adminApi.deleteUser(userId)
      await loadStudents()
    } catch (err) {
      const errorMsg = err.message || 'Failed to delete student'
      setError(errorMsg)
      alert(errorMsg)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading students...</p>
      </div>
    )
  }

  return (
    <div className="admin-users-view">
      <div className="admin-header">
        <div>
          <h2>Student Accounts</h2>
          <p className="admin-subtitle">Manage all student accounts in the system</p>
        </div>
        <button className="btn-create" onClick={() => setShowCreateModal(true)}>
          ➕ Create Student
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
          {filteredStudents.length} of {students.length} students
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
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                  {students.length === 0 ? 'No students found. Create your first student account.' : 'No students match your search.'}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.name || 'N/A'}</td>
                  <td>{student.email}</td>
                  <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-action"
                        onClick={() => handleEdit(student)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action"
                        onClick={() => handleResetPassword(student)}
                        title="Reset Password"
                      >
                        🔑
                      </button>
                      <button
                        className="btn-action btn-danger"
                        onClick={() => handleDelete(student.id)}
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
          userType="student"
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateStudent}
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

export default StudentsView

