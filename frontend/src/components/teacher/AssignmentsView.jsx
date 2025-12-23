import { useState, useEffect } from 'react'
import teacherApi from '../../services/teacherApi'
import './AssignmentsView.css'

const formatAssignmentType = (value) => {
  if (!value) return ''
  return value
    .toString()
    .trim()
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function AssignmentsView({ onAssignmentClick, onCreateAssignment, onGradeAssignment, onEditAssignment, onDeleteAssignment }) {
  const [assignments, setAssignments] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterClass, setFilterClass] = useState('all')
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsRes, classesRes] = await Promise.all([
          teacherApi.getAssignments(),
          teacherApi.getClasses()
        ])
        setAssignments(assignmentsRes.assignments || [])
        setClasses(classesRes.classes || [])
      } catch (error) {
        console.error('Failed to fetch assignments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      published: 'status-published',
      draft: 'status-draft',
      grading: 'status-grading',
      graded: 'status-graded',
    }
    return statusMap[status] || 'status-draft'
  }

  const filteredAssignments = assignments.filter(a => {
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus
    const matchesClass = filterClass === 'all' || String(a.class_id) === String(filterClass)
    return matchesStatus && matchesClass
  })

  const handleDelete = async (assignmentId, assignmentTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${assignmentTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(assignmentId)
    try {
      await teacherApi.deleteAssignment(assignmentId)
      // Remove from local state
      setAssignments(prev => prev.filter(a => a.id !== assignmentId))
      // Call parent handler if provided
      if (onDeleteAssignment) {
        onDeleteAssignment(assignmentId)
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      alert('Failed to delete assignment. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (assignmentId, newStatus) => {
    setUpdatingStatusId(assignmentId)
    try {
      await teacherApi.updateAssignment(assignmentId, { status: newStatus })
      // Update local state
      setAssignments(prev => prev.map(a => 
        a.id === assignmentId ? { ...a, status: newStatus } : a
      ))
    } catch (error) {
      console.error('Failed to update assignment status:', error)
      alert('Failed to update status. Please try again.')
      // Re-fetch assignments on error to ensure sync
      try {
        const response = await teacherApi.getAssignments()
        setAssignments(response.assignments || [])
      } catch (fetchError) {
        console.error('Failed to refresh assignments:', fetchError)
      }
    } finally {
      setUpdatingStatusId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
        <p>Loading assignments...</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="assignments-header">
        <button className="btn-create-assignment" onClick={onCreateAssignment}>
          ➕ Create Assignment
        </button>
      </div>

      {/* Filters */}
      <div className="assignments-filters assignments-filters--compact">
        <div className="filter-group">
          <label>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="grading">Needs Grading</option>
            <option value="graded">Graded</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Class</label>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-results">Showing {filteredAssignments.length}</div>
      </div>

      {/* Compact table */}
      <div className="assignments-table">
        <div className="table-head">
          <div>Assignment</div>
          <div>Status</div>
          <div>Due</div>
          <div>Points</div>
          <div className="actions-col">Actions</div>
        </div>

        {filteredAssignments.length > 0 ? (
          filteredAssignments.map(assignment => {
            const assignmentClass = classes.find(c => String(c.id) === String(assignment.class_id))
            const dueDate = assignment.due_date ? new Date(assignment.due_date) : null

            let dueDateLabel = 'No due date'
            let dueDateTooltip
            if (dueDate) {
              dueDateLabel = `Due ${dueDate.toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
              })}`
              dueDateTooltip = dueDate.toLocaleString(undefined, {
                dateStyle: 'full', timeStyle: 'short'
              })
            }

            const pointsValue = typeof assignment.total_points === 'number'
              ? assignment.total_points
              : Number.parseInt(assignment.total_points, 10)
            const safePointsValue = Number.isFinite(pointsValue) ? pointsValue : 100
            const assignmentTypeLabel = formatAssignmentType(assignment.assignment_type || 'homework')

            return (
              <div key={assignment.id} className="assignment-row">
                {/* Title / class / description (clamped) */}
                <div className="title-col">
                  <div className="title-line">
                    <button
                      className="link-title"
                      onClick={() => onAssignmentClick(assignment.id)}
                      title="Open assignment"
                    >
                      {assignment.title}
                    </button>
                  </div>
                  <div className="meta-line">
                    <span className="assignment-class-name">{assignmentClass?.name || 'Unknown Class'}</span>
                    <span className="dot" aria-hidden="true">•</span>
                    <span title={dueDateTooltip}>{dueDateLabel}</span>
                    {assignmentTypeLabel ? (
                      <>
                        <span className="dot" aria-hidden="true">•</span>
                        <span>{assignmentTypeLabel}</span>
                      </>
                    ) : null}
                  </div>
                  {assignment.description ? (
                    <div className="desc-line" title={assignment.description}>
                      {assignment.description}
                    </div>
                  ) : null}
                </div>

                {/* Status */}
                <div className="status-col">
                  <select
                    value={assignment.status || 'draft'}
                    onChange={(e) => handleStatusChange(assignment.id, e.target.value)}
                    disabled={updatingStatusId === assignment.id}
                    className={`status-select ${getStatusBadgeClass(assignment.status)}`}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid transparent',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: updatingStatusId === assignment.id ? 'wait' : 'pointer',
                      textTransform: 'capitalize',
                      minWidth: '100px',
                      backgroundColor: assignment.status === 'published' ? '#c6f6d5' :
                                      assignment.status === 'draft' ? '#fed7d7' :
                                      assignment.status === 'grading' ? '#feebc8' :
                                      assignment.status === 'graded' ? '#bee3f8' : '#e2e8f0',
                      color: assignment.status === 'published' ? '#276749' :
                             assignment.status === 'draft' ? '#c53030' :
                             assignment.status === 'grading' ? '#c05621' :
                             assignment.status === 'graded' ? '#2c5282' : '#4a5568',
                      opacity: updatingStatusId === assignment.id ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (updatingStatusId !== assignment.id) {
                        e.target.style.borderColor = '#cbd5e0'
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = 'transparent'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="grading">Grading</option>
                    <option value="graded">Graded</option>
                  </select>
                </div>

                {/* Due (short) */}
                <div className="due-col" title={dueDateTooltip}>{dueDateLabel}</div>

                {/* Points */}
                <div className="points-col">{safePointsValue}</div>

                {/* Actions */}
                <div className="actions-col">
                  <button
                    className="btn-assignment-action btn-view"
                    onClick={() => onAssignmentClick(assignment.id)}
                    aria-label="View assignment"
                    title="View"
                  >
                    View
                  </button>
                  <button
                    className="btn-assignment-action btn-grade"
                    onClick={() => onGradeAssignment(assignment.id)}
                    aria-label="Grade assignment"
                    title="Grade"
                  >
                    Grade
                  </button>
                  <button
                    className="btn-assignment-action btn-delete"
                    onClick={() => handleDelete(assignment.id, assignment.title)}
                    aria-label="Delete assignment"
                    title="Delete"
                    disabled={deletingId === assignment.id}
                    style={{
                      background: deletingId === assignment.id ? '#cbd5e0' : '#fed7d7',
                      color: deletingId === assignment.id ? '#718096' : '#c53030',
                      border: '1px solid #feb2b2',
                      cursor: deletingId === assignment.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {deletingId === assignment.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="empty-state">
            <div className="emoji">📝</div>
            <h3>No Assignments</h3>
            <p>Click the button above to create your first assignment</p>
          </div>
        )}
      </div>
    </>
  )
}

export default AssignmentsView
