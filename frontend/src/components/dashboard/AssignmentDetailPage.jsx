import { useState, useEffect } from 'react'
import { getDaysUntilDue } from '../../utils/helpers'
import studentApi from '../../services/studentApi'

function AssignmentDetailPage({ assignmentId, onBack }) {
  const [submissionText, setSubmissionText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [assignmentData, setAssignmentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Fetch assignment details when component mounts
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!assignmentId) {
        setError('No assignment ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await studentApi.getAssignmentDetail(assignmentId)
        if (response.success && response.assignment) {
          setAssignmentData(response.assignment)
        } else {
          setError('Failed to load assignment details')
        }
      } catch (err) {
        console.error('Error fetching assignment details:', err)
        setError(err.message || 'Failed to load assignment details')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignmentDetails()
  }, [assignmentId])
  
  const handleMultipleChoiceChange = (questionId, optionId) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: optionId
    })
  }
  
  const handleShortAnswerChange = (questionId, answer) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionId]: answer
    })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="assignment-detail-page">
        <button className="btn-back" onClick={onBack}>
          ← Back to Assignments
        </button>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading assignment details...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !assignmentData) {
    return (
      <div className="assignment-detail-page">
        <button className="btn-back" onClick={onBack}>
          ← Back to Assignments
        </button>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#c53030' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p>{error || 'Assignment not found'}</p>
        </div>
      </div>
    )
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    try {
      // Prepare submission data
      const submissionData = {
        text: submissionText,
        answers: []
      }

      // If there are quiz answers, format them for submission
      if (assignmentData.hasQuestions && Object.keys(quizAnswers).length > 0) {
        submissionData.answers = Object.entries(quizAnswers).map(([questionId, answer]) => ({
          questionId: parseInt(questionId),
          answerText: typeof answer === 'string' ? answer : null,
          selectedOption: typeof answer === 'string' && answer.length === 1 ? answer : null
        }))
      }

      // Submit the assignment
      const response = await studentApi.submitAssignment(assignmentId, submissionData)
      
      if (response.success) {
        alert('Assignment submitted successfully!')
        // Refresh the assignment data to show submitted status
        const updatedResponse = await studentApi.getAssignmentDetail(assignmentId)
        if (updatedResponse.success && updatedResponse.assignment) {
          setAssignmentData(updatedResponse.assignment)
        }
      } else {
        alert('Failed to submit assignment. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      alert(`Error: ${error.message || 'Failed to submit assignment'}`)
    }
  }

  const priorityColor = {
    high: '#f56565',
    medium: '#ed8936',
    low: '#48bb78'
  }

  return (
    <div className="assignment-detail-page">
      {/* Header */}
      <div className="detail-page-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Assignments
        </button>
        
        <div className="assignment-detail-hero">
          <div className="assignment-hero-header">
            <div>
              <h1 className="assignment-detail-title">{assignmentData.title}</h1>
              <p className="assignment-detail-class">
                <span className="class-icon">📚</span>
                {assignmentData.class}
              </p>
            </div>
            <span 
              className={`priority-badge-large ${assignmentData.priority}`}
              style={{ background: `${priorityColor[assignmentData.priority]}20`, color: priorityColor[assignmentData.priority] }}
            >
              {assignmentData.priority} priority
            </span>
          </div>

          <div className="assignment-meta-grid">
            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <div>
                <span className="meta-label">Due Date</span>
                <span className="meta-value">{assignmentData.dueDate} at {assignmentData.dueTime}</span>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon">⏰</span>
              <div>
                <span className="meta-label">Time Remaining</span>
                <span className="meta-value">{getDaysUntilDue(assignmentData.dueDate)}</span>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon">📊</span>
              <div>
                <span className="meta-label">Status</span>
                <span className={`status-badge ${assignmentData.status}`}>{assignmentData.status}</span>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon">⚖️</span>
              <div>
                <span className="meta-label">Weight</span>
                <span className="meta-value">{assignmentData.weight}% of final grade</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="assignment-detail-content">
        <div className="assignment-main-column">
          {/* Description */}
          <div className="detail-card">
            <h2>📝 Assignment Description</h2>
            <div className="assignment-description">
              <p>{assignmentData.description}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="detail-card">
            <h2>📋 Instructions</h2>
            <div className="assignment-instructions">
              {assignmentData.instructions && assignmentData.instructions.length > 0 ? (
                <ol>
                  {assignmentData.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              ) : (
                <p style={{ color: '#718096', fontStyle: 'italic' }}>No specific instructions provided. Please follow the assignment description above.</p>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="detail-card">
            <h2>✅ Requirements</h2>
            <div className="requirements-list">
              {assignmentData.requirements && assignmentData.requirements.length > 0 ? (
                assignmentData.requirements.map((req, index) => (
                  <div key={index} className="requirement-item">
                    <span className="requirement-icon">•</span>
                    <span>{req}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#718096', fontStyle: 'italic' }}>No specific requirements listed. Refer to the instructions and rubric.</p>
              )}
            </div>
          </div>

          {/* Resources */}
          {assignmentData.resources && assignmentData.resources.length > 0 && (
            <div className="detail-card">
              <h2>📚 Resources</h2>
              <div className="resources-list">
                {assignmentData.resources.map((resource, index) => (
                  <div key={index} className="resource-item">
                    <span className="resource-icon">📄</span>
                    <div className="resource-info">
                      <span className="resource-name">{resource.name}</span>
                      <span className="resource-type">{resource.type}</span>
                    </div>
                    <button className="btn-download-resource">Download</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Questions Section */}
          {assignmentData.hasQuestions && assignmentData.questions && (
            <div className="detail-card quiz-card">
              <h2>📝 Quiz Questions</h2>
              <div className="quiz-questions">
                {assignmentData.questions.map((question, index) => (
                  <div key={question.id} className="quiz-question">
                    <div className="question-header">
                      <span className="question-number">Question {index + 1}</span>
                      <span className="question-points">{question.points} points</span>
                    </div>
                    <p className="question-text">{question.question}</p>
                    
                    {question.type === 'multiple-choice' && (
                      <div className="multiple-choice-options">
                        {question.options.map((option) => (
                          <label key={option.id} className="option-label">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.id}
                              checked={quizAnswers[question.id] === option.id}
                              onChange={() => handleMultipleChoiceChange(question.id, option.id)}
                            />
                            <span className="option-text">
                              <span className="option-letter">{option.id.toUpperCase()}.</span>
                              {option.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'short-answer' && (
                      <div className="short-answer-section">
                        <textarea
                          className="short-answer-textarea"
                          placeholder="Type your answer here... Show all working."
                          rows="6"
                          value={quizAnswers[question.id] || ''}
                          onChange={(e) => handleShortAnswerChange(question.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission Section */}
          <div className="detail-card submission-card">
            <h2>📤 Submit {assignmentData.hasQuestions ? 'Quiz' : 'Assignment'}</h2>
            
            {assignmentData.status === 'submitted' ? (
              <div className="submission-success">
                <span className="success-icon">✓</span>
                <div>
                  <p className="success-title">Assignment Submitted</p>
                  <p className="success-date">Submitted on {assignmentData.submittedDate || 'Oct 15, 2025'}</p>
                </div>
              </div>
            ) : (
              <>
                {assignmentData.hasQuestions ? (
                  <div className="quiz-submission-info">
                    <p className="submission-instructions">
                      ✅ Complete all questions above and click submit when ready.
                    </p>
                    <div className="progress-info">
                      <span>Questions Answered: {Object.keys(quizAnswers).length} / {assignmentData.questions?.length || 0}</span>
                    </div>
                    <button 
                      className="btn-submit-assignment"
                      onClick={handleSubmit}
                      disabled={Object.keys(quizAnswers).length !== (assignmentData.questions?.length || 0)}
                    >
                      Submit Quiz
                    </button>
                  </div>
                ) : (
                  <div className="submission-form">
                    <div className="form-group">
                      <label htmlFor="submission-text">Written Response</label>
                      <textarea
                        id="submission-text"
                        className="submission-textarea"
                        placeholder="Type your response here..."
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        rows="8"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="file-upload">Attach Files</label>
                      <div className="file-upload-area">
                        <input
                          id="file-upload"
                          type="file"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="file-upload" className="file-upload-label">
                          <span className="upload-icon">📎</span>
                          <span>Click to upload or drag and drop</span>
                          <span className="upload-hint">PDF, DOC, DOCX up to 10MB</span>
                        </label>
                        {selectedFile && (
                          <div className="selected-file">
                            <span className="file-icon">📄</span>
                            <span>{selectedFile.name}</span>
                            <button onClick={() => setSelectedFile(null)} className="btn-remove-file">✕</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      className="btn-submit-assignment"
                      onClick={handleSubmit}
                      disabled={!submissionText && !selectedFile}
                    >
                      Submit Assignment
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="assignment-sidebar">
          {/* Quick Info */}
          <div className="detail-card sidebar-card">
            <h3>Quick Info</h3>
            <div className="sidebar-info-list">
              <div className="sidebar-info-item">
                <span className="info-label">Posted</span>
                <span className="info-value">{assignmentData.postedDate || 'Oct 10, 2025'}</span>
              </div>
              <div className="sidebar-info-item">
                <span className="info-label">Due</span>
                <span className="info-value">{assignmentData.dueDate}</span>
              </div>
              <div className="sidebar-info-item">
                <span className="info-label">Total Points</span>
                <span className="info-value">{assignmentData.totalPoints || '100'}</span>
              </div>
              <div className="sidebar-info-item">
                <span className="info-label">Submission Type</span>
                <span className="info-value">{assignmentData.submissionType || 'Online'}</span>
              </div>
            </div>
          </div>

          {/* Grading Rubric */}
          <div className="detail-card sidebar-card">
            <h3>Grading Rubric</h3>
            <div className="rubric-list">
              {assignmentData.rubric && assignmentData.rubric.length > 0 ? (
                assignmentData.rubric.map((item, index) => (
                  <div key={index} className="rubric-item">
                    <div className="rubric-criteria">{item.criteria}</div>
                    <div className="rubric-points">{item.points} pts</div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#718096', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  Rubric will be shared when grading
                </p>
              )}
            </div>
          </div>

          {/* Helpful Tips */}
          <div className="detail-card sidebar-card tips-card">
            <h3>💡 Helpful Tips</h3>
            <ul className="tips-list">
              <li>Start early and manage your time</li>
              <li>Read all instructions carefully</li>
              <li>Check the rubric before submitting</li>
              <li>Proofread your work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignmentDetailPage

