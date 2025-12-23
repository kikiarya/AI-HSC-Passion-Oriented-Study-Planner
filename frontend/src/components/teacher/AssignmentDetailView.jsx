import { useEffect, useState } from 'react'
import teacherApi from '../../services/teacherApi'
import './CreateAssignmentView.css'

function AssignmentDetailView({ assignmentId, onBack, onEdit }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignment, setAssignment] = useState(null)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true)
        const res = await teacherApi.getAssignmentById(assignmentId)
        setAssignment(res.assignment)
      } catch (err) {
        console.error('Failed to fetch assignment:', err)
        setError('Failed to load assignment')
      } finally {
        setLoading(false)
      }
    }
    if (assignmentId) fetchDetails()
  }, [assignmentId])

  if (loading) {
    return (
      <div className="create-assignment-view">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#718096' }}>Loading assignment...</p>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="create-assignment-view">
        <div className="create-assignment-header">
          <button className="btn-back" onClick={onBack}>← Back to Assignments</button>
          <h2>Assignment Details</h2>
        </div>
        <div className="assignment-form">
          <p style={{ color: '#c53030' }}>{error || 'Assignment not found'}</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'draft': 'status-badge-draft',
      'published': 'status-badge-published',
      'active': 'status-badge-active',
      'completed': 'status-badge-completed'
    }
    return statusMap[status] || 'status-badge-default'
  }

  return (
    <div className="create-assignment-view">
      <div className="create-assignment-header">
        <button className="btn-back" onClick={onBack}>← Back to Assignments</button>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#2d3748', margin: 0 }}>
          📋 {assignment.title}
        </h2>
      </div>

      <div className="assignment-form">
        <div className="form-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            <span>📊</span> Overview
          </h3>
          <div className="assignment-overview-card">
            <div className="overview-grid">
              <div className="overview-item">
                <div className="overview-icon">🏫</div>
                <div className="overview-content">
                  <span className="overview-label">Class</span>
                  <span className="overview-value">{assignment.className || assignment.classCode || '—'}</span>
                </div>
              </div>
              <div className="overview-item">
                <div className="overview-icon">📅</div>
                <div className="overview-content">
                  <span className="overview-label">Due Date</span>
                  <span className="overview-value">{formatDate(assignment.due_date || assignment.dueDate)}</span>
                </div>
              </div>
              <div className="overview-item">
                <div className="overview-icon">📝</div>
                <div className="overview-content">
                  <span className="overview-label">Type</span>
                  <span className="overview-value">{(assignment.submission_type || assignment.assignment_type || 'homework').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              </div>
              <div className="overview-item">
                <div className="overview-icon">⭐</div>
                <div className="overview-content">
                  <span className="overview-label">Total Points</span>
                  <span className="overview-value">{assignment.total_points || assignment.totalPoints || 100} pts</span>
                </div>
              </div>
              <div className="overview-item">
                <div className="overview-icon">📌</div>
                <div className="overview-content">
                  <span className="overview-label">Status</span>
                  <span className={`status-badge ${getStatusBadgeClass(assignment.status || 'draft')}`}>
                    {(assignment.status || 'draft').charAt(0).toUpperCase() + (assignment.status || 'draft').slice(1)}
                  </span>
                </div>
              </div>
              {assignment.hasQuestions && (
                <div className="overview-item">
                  <div className="overview-icon">❓</div>
                  <div className="overview-content">
                    <span className="overview-label">Questions</span>
                    <span className="overview-value">{(assignment.questions || []).length} questions</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="form-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            <span>📄</span> Description
          </h3>
          <textarea 
            value={assignment.description || ''} 
            readOnly 
            rows="4" 
            placeholder={assignment.description ? '' : 'No description provided'}
            style={{ 
              background: assignment.description ? '#f7fafc' : '#f7fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              resize: 'none',
              color: assignment.description ? '#2d3748' : '#718096',
              fontStyle: assignment.description ? 'normal' : 'italic',
              width: '100%'
            }} 
          />
        </div>

        <div className="form-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            <span>❓</span> Questions
            <span style={{ 
              marginLeft: 'auto', 
              fontSize: '0.875rem', 
              fontWeight: 500, 
              color: '#718096',
              background: '#f7fafc',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px'
            }}>
              {(assignment.questions || []).length} {(assignment.questions || []).length === 1 ? 'question' : 'questions'}
            </span>
          </h3>
          {(assignment.questions || []).length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              background: '#f7fafc',
              borderRadius: '12px',
              border: '2px dashed #e2e8f0'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❓</div>
              <p style={{ color: '#718096', fontSize: '1rem' }}>No questions found for this assignment.</p>
            </div>
          ) : (
            <div className="questions-list">
              {(assignment.questions || []).map((q, idx) => (
                <div key={q.id || idx} className="question-item-enhanced">
                  <div className="question-header-enhanced">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="question-number-badge">Q{q.position || idx + 1}</span>
                      <span className="question-type-badge" style={{
                        background: q.type === 'multiple-choice' ? '#667eea20' : '#48bb7820',
                        color: q.type === 'multiple-choice' ? '#667eea' : '#48bb78',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {q.type?.replace('_', ' ') || 'question'}
                      </span>
                    </div>
                    <span className="question-points-badge">
                      {q.points} {q.points === 1 ? 'pt' : 'pts'}
                    </span>
                  </div>
                  <div className="question-text-enhanced">
                    {q.question}
                  </div>
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#4a5568', 
                        marginBottom: '0.75rem' 
                      }}>
                        Options:
                      </div>
                      <ul className="options-list-enhanced">
                        {q.options.map((opt) => (
                          <li 
                            key={opt.option_key || opt.key} 
                            className={`option-item-enhanced ${opt.is_correct ? 'option-correct' : ''}`}
                          >
                            <span className="option-key-badge">{opt.option_key || opt.key}</span>
                            <span className="option-text">{opt.text}</span>
                            {opt.is_correct && (
                              <span className="correct-indicator">✓ Correct Answer</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="form-actions">
          <button className="btn-cancel" onClick={onBack}>Back</button>
          {onEdit && (
            <button 
              className="btn-primary" 
              onClick={() => onEdit(assignmentId)}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: '1rem'
              }}
            >
              ✏️ Edit Assignment
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssignmentDetailView


