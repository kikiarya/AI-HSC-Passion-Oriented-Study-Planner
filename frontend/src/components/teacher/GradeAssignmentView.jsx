import { useState, useEffect, useMemo } from 'react'
import teacherApi from '../../services/teacherApi'
import './GradeAssignmentView.css'

function GradeAssignmentView({ assignmentId, onBack }) {
  const [assignment, setAssignment] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiGrading, setAiGrading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const submissionsRes = await teacherApi.getAssignmentSubmissions(assignmentId)

        // The backend now returns both assignment data and submissions
        const assignmentData = submissionsRes.assignment
        const subs = submissionsRes.submissions || submissionsRes.data || []

        if (!assignmentData) {
          // Fallback: fetch assignment separately if not included
          const assignmentRes = await teacherApi.getAssignmentById(assignmentId)
          const a = assignmentRes.assignment || assignmentRes.data
          setAssignment(a)
        } else {
          setAssignment(assignmentData)
        }

        setSubmissions(subs)

        if (subs.length > 0) {
          handleSelectSubmission(subs[0])
        }
      } catch (error) {
        console.error('Failed to fetch assignment data:', error)
        setAssignment(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [assignmentId])

  const gradedCount = useMemo(
    () => submissions.filter(s => s.status === 'graded').length,
    [submissions]
  )
  const pendingCount = useMemo(
    () => submissions.filter(s => s.status !== 'graded').length,
    [submissions]
  )

  // Calculate total points from rubric
  const rubricTotal = useMemo(() => {
    if (!assignment?.rubric || assignment.rubric.length === 0) {
      return assignment?.total_points || 100
    }
    return assignment.rubric.reduce((sum, item) => sum + (item.points || 0), 0)
  }, [assignment])

  const getStudentObj = (s) => s?.student || s?.profiles || null
  const getStudentName = (s) => {
    const st = getStudentObj(s)
    if (!st) return 'Unknown Student'
    const name = `${st.first_name || ''} ${st.last_name || ''}`.trim()
    return name || st.email || 'Unknown Student'
  }

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission)
    setGradeData({
      grade: submission.grade ?? '',
      feedback: submission.feedback ?? ''
    })
  }

  const handleGradeChange = (e) => {
    const { name, value } = e.target
    setGradeData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return

    if (gradeData.grade === '' || gradeData.grade === null) {
      alert('Please enter a grade')
      return
    }

    setSaving(true)
    try {
      await teacherApi.gradeSubmission(assignmentId, selectedSubmission.id, gradeData)

      // update local copy
      setSubmissions(prev => prev.map(sub =>
        sub.id === selectedSubmission.id
          ? { ...sub, grade: gradeData.grade, feedback: gradeData.feedback, status: 'graded' }
          : sub
      ))

      alert('Grade saved successfully!')

      // auto-advance to next
      const idx = submissions.findIndex(s => s.id === selectedSubmission.id)
      if (idx > -1 && idx < submissions.length - 1) {
        handleSelectSubmission(submissions[idx + 1])
      }
    } catch (error) {
      console.error('Failed to save grade:', error)
      alert('Failed to save grade. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAIAutoGrade = async () => {
    if (!selectedSubmission || !assignment) return

    const confirmed = window.confirm(
      'Use AI to automatically grade this submission? You can review and modify the grade before saving.'
    )
    if (!confirmed) return

    setAiGrading(true)
    try {
      const response = await teacherApi.autoGradeSubmission(selectedSubmission.id, assignmentId)
      // authService.authenticatedRequest returns the data directly, not wrapped in { data: ... }
      const data = response || {}
      setGradeData({
        grade: data.grade ?? '',
        feedback: data.feedback ?? ''
      })
      alert(`AI Grading Complete!\nSuggested Grade: ${data.grade ?? '—'}\n\nPlease review and save if you agree.`)
    } catch (error) {
      console.error('AI grading failed:', error)
      alert('AI grading failed. Please grade manually.')
    } finally {
      setAiGrading(false)
    }
  }

  if (loading) {
    return (
      <div className="center-state">
        <div className="big-emoji">⏳</div>
        <p>Loading assignment data...</p>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="center-state">
        <div className="big-emoji">❌</div>
        <h3>Assignment Not Found</h3>
        <button className="btn btn--back" onClick={onBack}>← Back to Assignments</button>
      </div>
    )
  }

  return (
    <div className="grade-assignment-view">
      {/* Header */}
      <div className="grade-header">
        <button className="btn btn--back" onClick={onBack}>← Back</button>
        <div className="assignment-meta">
          <h2 className="title">{assignment.title}</h2>
          <div className="grade-stats">
            <span className="chip">Total: {submissions.length}</span>
            <span className="chip chip--success">Graded: {gradedCount}</span>
            <span className="chip chip--warn">Pending: {pendingCount}</span>
          </div>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="center-state">
          <div className="big-emoji">📭</div>
          <h3>No Submissions Yet</h3>
          <p>No students have submitted this assignment yet.</p>
        </div>
      ) : (
        <div className="grading-container">
          {/* Left: Submissions list */}
          <aside className={`submissions-list ${sidebarCollapsed ? 'collapsed' : ''}`} aria-label="Submissions">
            <div className="list-header">
              <h3>Submissions</h3>
              <div className="list-header-actions">
                <span className="muted">{submissions.length}</span>
                <button 
                  className="collapse-btn" 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? 'Expand' : 'Collapse'}
                >
                  {sidebarCollapsed ? '→' : '←'}
                </button>
              </div>
            </div>

            {!sidebarCollapsed && (
              <div className="list-scroll">
                {submissions.map(submission => {
                  const isActive = selectedSubmission?.id === submission.id
                  return (
                    <button
                      type="button"
                      key={submission.id}
                      className={`submission-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectSubmission(submission)}
                    >
                      <div className="submission-item__main">
                        <span className="student-avatar" aria-hidden>👤</span>
                        <span className="student-name">{getStudentName(submission)}</span>
                      </div>
                      <div className="submission-item__meta">
                        <span className="submission-date">
                          {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : '—'}
                        </span>
                        <span className={`chip chip--${submission.status === 'graded' ? 'success' : 'warn'}`}>
                          {submission.status === 'graded' ? 'Graded' : 'Pending'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </aside>

          {/* Right: Grading panel */}
          {selectedSubmission && (
            <main className="grading-panel">
              <div className="submission-header">
                <h3 className="panel-title">
                  {getStudentName(selectedSubmission)}’s Submission
                </h3>
                <span className="submission-date">
                  Submitted {selectedSubmission.submitted_at ? new Date(selectedSubmission.submitted_at).toLocaleString() : '—'}
                </span>
              </div>

              {/* AI Grade */}
              <div className="ai-grade-row">
                <button
                  className="btn btn--primary"
                  onClick={handleAIAutoGrade}
                  disabled={aiGrading}
                >
                  {aiGrading ? <span className="spinner" aria-hidden /> : '✨'}
                  {aiGrading ? ' AI Grading...' : ' AI Auto-Grade'}
                </button>
                <span className="muted small">AI will suggest a grade and feedback. Review before saving.</span>
              </div>

              {/* Rubric */}
              {assignment.rubric && assignment.rubric.length > 0 && (
                <section className="rubric-section">
                  <h4 className="section-title">Grading Rubric</h4>
                  <div className="rubric-container">
                    {assignment.rubric.map((item, index) => (
                      <div key={item.id || index} className="rubric-item">
                        <div className="rubric-item-header">
                          <span className="rubric-criteria">{item.criteria}</span>
                          <span className="rubric-points">{item.points} pts</span>
                        </div>
                      </div>
                    ))}
                    <div className="rubric-total">
                      <span>Total Points:</span>
                      <span className="total-value">{rubricTotal} pts</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Submission content */}
              <section className="submission-content">
                <h4 className="section-title">Submission Content</h4>
                <div className="content-box">
                  <p>{selectedSubmission.text_response || selectedSubmission.submission_content || 'No text content.'}</p>
                  {(selectedSubmission.file_url || selectedSubmission.submission_file_url) && (
                    <div className="attachments">
                      <p>📎 Attachment: <a href={selectedSubmission.file_url || selectedSubmission.submission_file_url} target="_blank" rel="noopener noreferrer">View file</a></p>
                    </div>
                  )}
                </div>
              </section>

              {/* Grading form */}
              <section className="grading-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gradeInput">
                      Grade (out of {rubricTotal})
                      {assignment.rubric && assignment.rubric.length > 0 && (
                        <span className="grade-hint"> — See rubric above for breakdown</span>
                      )}
                    </label>
                    <input
                      id="gradeInput"
                      type="number"
                      name="grade"
                      className="grade-input"
                      value={gradeData.grade}
                      onChange={handleGradeChange}
                      max={rubricTotal}
                      min="0"
                      step="0.5"
                      placeholder="Enter grade"
                      inputMode="decimal"
                    />
                  </div>

                  <div className="form-group grow">
                    <label htmlFor="feedbackTextarea">Feedback Comments</label>
                    <textarea
                      id="feedbackTextarea"
                      name="feedback"
                      className="feedback-textarea"
                      value={gradeData.feedback}
                      onChange={handleGradeChange}
                      rows={5}
                      placeholder="Enter feedback comments..."
                    />
                  </div>
                </div>

                <div className="grading-actions">
                  <button
                    className="btn btn--primary btn--block"
                    onClick={handleSaveGrade}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Grade'}
                  </button>
                </div>
              </section>
            </main>
          )}
        </div>
      )}
    </div>
  )
}

export default GradeAssignmentView
