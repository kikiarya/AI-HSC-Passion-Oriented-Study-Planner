import { useState, useEffect } from 'react'
import teacherApi from '../../services/teacherApi'
import './MyClassesView.css'

function MyClassesView({ onClassClick }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    color: '#667eea',
    location: ''
  })

  const fetchClasses = async () => {
    try {
      const response = await teacherApi.getClasses()
      setClasses(response.classes || [])
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.code || !formData.name) {
      alert('Please enter class code and name')
      return
    }

    setCreating(true)
    try {
      await teacherApi.createClass(formData)
      alert('Class created successfully!')
      setShowCreateModal(false)
      setFormData({ code: '', name: '', description: '', color: '#667eea', location: '' })
      fetchClasses() // Refresh the list
    } catch (error) {
      console.error('Failed to create class:', error)
      console.error('Error details:', error.message, error.response)
      const errorMessage = error.message || 'Unknown error'
      alert(`Failed to create class: ${errorMessage}\n\nPlease check the browser console for details.`)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading classes...</p>
      </div>
    )
  }

  return (
    <>
      {/* Header with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '2rem' }}>
        <button 
          className="btn-primary-action"
          onClick={() => setShowCreateModal(true)}
          style={{ padding: '0.75rem 1.5rem' }}
        >
          ➕ Create Class
        </button>
      </div>

      {/* Empty State */}
      {classes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3>No Classes Yet</h3>
          <p style={{ marginBottom: '2rem', color: '#718096' }}>You haven't created any classes</p>
          <button 
            className="btn-primary-action"
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '0.75rem 2rem' }}
          >
            ➕ Create Your First Class
          </button>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length > 0 && (
        <div className="classes-grid">
          {classes.map(classItem => (
            <div
              key={classItem.id}
              className="class-card-detailed"
              style={{ borderTop: `4px solid ${classItem.color || '#667eea'}` }}
            >
              <div className="class-card-header">
                <div className="class-icon" style={{ background: `${classItem.color || '#667eea'}20`, color: classItem.color || '#667eea' }}>
                  📚
                </div>
                <span className="class-period">{classItem.code}</span>
              </div>
              <h3>{classItem.name}</h3>
              <p className="class-description">{classItem.description || 'No description'}</p>
              
              <div className="class-stats">
                <div className="stat-item">
                  <span className="stat-label">Students</span>
                  <span className="stat-value">{classItem.studentCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Assignments</span>
                  <span className="stat-value">{classItem.assignmentCount || 0}</span>
                </div>
                {classItem.avgGrade && (
                  <div className="stat-item">
                    <span className="stat-label">Avg Grade</span>
                    <span className="stat-value">{classItem.avgGrade}</span>
                  </div>
                )}
              </div>

              <button
                className="btn-class-action"
                style={{ background: classItem.color || '#667eea' }}
                onClick={() => onClassClick(classItem.id)}
              >
                View Class
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Class</h3>
              <button className="btn-close-modal" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Class Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g., MATH12-ADV-A"
                  required
                />
              </div>

              <div className="form-group">
                <label>Class Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., HSC Mathematics Advanced - A"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter class description..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Room 302, Building A"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={creating}
                  style={{ opacity: creating ? 0.6 : 1 }}
                >
                  {creating ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default MyClassesView
