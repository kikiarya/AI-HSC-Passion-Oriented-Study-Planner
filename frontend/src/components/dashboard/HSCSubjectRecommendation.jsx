import { useState, useEffect } from 'react'
import { generateCourseRecommendation } from '../../services/courseService'
import studentApi from '../../services/studentApi'

function HSCSubjectRecommendation() {
  const [interestInput, setInterestInput] = useState('')
  const [generated, setGenerated] = useState(false)
  const [notification, setNotification] = useState(null)
  const [apiResults, setApiResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [processingSubject, setProcessingSubject] = useState(null) // Track which subject is being processed

  // Load saved recommendations and selected subjects on component mount
  useEffect(() => {
    // Load saved recommendations from localStorage
    const savedRecommendations = localStorage.getItem('hsc_recommendations')
    const savedInterests = localStorage.getItem('hsc_interests')
    
    if (savedRecommendations) {
      try {
        const parsed = JSON.parse(savedRecommendations)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApiResults(parsed)
          setGenerated(true)
          if (savedInterests) {
            setInterestInput(savedInterests)
          }
        }
      } catch (e) {
        console.error('Failed to parse saved recommendations:', e)
        // Clear invalid data
        localStorage.removeItem('hsc_recommendations')
        localStorage.removeItem('hsc_interests')
      }
    }

    // Load selected subjects from database
    const fetchSelectedSubjects = async () => {
      try {
        const response = await studentApi.getSelectedSubjects()
        const subjects = response.subjects || []
        setSelectedSubjects(subjects)
      } catch (e) {
        console.error('Failed to load selected subjects:', e)
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSelectedSubjects()
  }, [])

  const handleGenerate = async () => {
    setError('')
    setLoading(true)
    try {
      const prompt = `Student interests: ${interestInput || 'general interests'}\nPlease recommend HSC subjects with brief reasoning in the specified JSON format.`
      const response = await generateCourseRecommendation({ prompt})
      const results = Array.isArray(response) ? response : []
      setApiResults(results)
      setGenerated(true)
      
      // Save recommendations and interests to localStorage
      if (results.length > 0) {
        localStorage.setItem('hsc_recommendations', JSON.stringify(results))
        localStorage.setItem('hsc_interests', interestInput)
      }
      
      setNotification({ type: 'success', message: 'Recommendations generated based on your interests.' })
      setTimeout(() => setNotification(null), 3000)
    } catch (e) {
      setError(e?.message || 'Failed to generate recommendations')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Low': return '#48bb78'
      case 'Medium': return '#ed8936'
      case 'High': return '#f56565'
      case 'Very High': return '#c53030'
      case 'Extreme': return '#742a2a'
      default: return '#718096'
    }
  }

  const toggleSubjectSelection = async (subject) => {
    const subjectCode = subject.code
    const subjectName = subject.recommend_subject || subject.name
    const subjectKey = `${subjectCode}-${subjectName}`
    
    // Prevent duplicate calls for the same subject
    if (processingSubject === subjectKey) {
      return
    }
    
    // Check if already selected
    const existingSubject = selectedSubjects.find(
      s => s.subject_code === subjectCode && s.subject_name === subjectName
    )
    
    setProcessingSubject(subjectKey)
    
    // Optimistic update: immediately update UI
    const previousState = [...selectedSubjects]
    let tempId = null
    
    if (existingSubject) {
      // Optimistically remove from UI immediately
      setSelectedSubjects(selectedSubjects.filter(s => s.id !== existingSubject.id))
      setNotification({ 
        type: 'success', 
        message: `Removed "${subjectName}" from your selections` 
      })
      setTimeout(() => setNotification(null), 3000)
    } else {
      // Optimistically add to UI immediately with temporary ID
      tempId = `temp-${Date.now()}-${Math.random()}`
      const tempSubject = {
        id: tempId,
        subject_code: subjectCode,
        subject_name: subjectName,
        category: subject.category,
        reasoning: subject.reasoning || subject.Reasoning
      }
      setSelectedSubjects([...selectedSubjects, tempSubject])
      setNotification({ 
        type: 'success', 
        message: `Added "${subjectName}" to your selections ✓` 
      })
      setTimeout(() => setNotification(null), 3000)
    }
    
    // Then update database in background
    try {
      if (existingSubject) {
        // Unselect: Delete from database
        await studentApi.deleteSelectedSubject(existingSubject.id)
        // UI already updated, no need to update again
      } else {
        // Select: Add to database
        const response = await studentApi.addSelectedSubject({
          subject_code: subjectCode,
          subject_name: subjectName,
          category: subject.category,
          reasoning: subject.reasoning || subject.Reasoning
        })
        
        if (response.success && tempId) {
          // Replace temporary subject with real one from database
          setSelectedSubjects(prev => {
            // Remove temp subject and add real one
            const filtered = prev.filter(s => s.id !== tempId)
            return [...filtered, response.data]
          })
        }
      }
    } catch (e) {
      // Rollback on error
      setSelectedSubjects(previousState)
      setNotification(null) // Clear the optimistic success notification
      
      // Check if it's a duplicate error
      if (e.message && e.message.includes('already selected') && !existingSubject) {
        // Refresh the list to get the actual state
        try {
          const response = await studentApi.getSelectedSubjects()
          const subjects = response.subjects || []
          setSelectedSubjects(subjects)
          // Don't show error since the subject is actually selected
        } catch (refreshError) {
          console.error('Failed to refresh selected subjects:', refreshError)
          setNotification({ 
            type: 'error', 
            message: 'Failed to refresh selection. Please refresh the page.' 
          })
          setTimeout(() => setNotification(null), 3000)
        }
      } else {
        setNotification({ 
          type: 'error', 
          message: e.message || 'Failed to save selection. Please try again.' 
        })
        setTimeout(() => setNotification(null), 3000)
      }
    } finally {
      setProcessingSubject(null)
    }
  }

  const isSubjectSelected = (subject) => {
    const subjectCode = subject.code
    const subjectName = subject.recommend_subject || subject.name
    return selectedSubjects.some(
      s => s.subject_code === subjectCode && s.subject_name === subjectName
    )
  }

  return (
    <div className="hsc-subjects-container">
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button className="notification-close" onClick={() => setNotification(null)}>
            ×
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="search-filters-section">
        <div className="filters-row">
          <div className="filter-group" style={{ flex: 2 }}>
            <label>Interests</label>
            <input
              type="text"
              className="search-input"
              placeholder="e.g., software, health, design, business, environment"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
            />
          </div>
          <div className="filter-group" style={{ width: '240px' }}>
            <label style={{ visibility: 'hidden' }}>Generate</label>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating…' : '✨ Generate Recommendation'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-text" style={{ marginTop: '0.5rem' }}>{error}</div>
      )}

      {/* Selected Subjects Summary - Always visible if there are selections */}
      {selectedSubjects.length > 0 && (
        <div className="selected-summary" style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          marginTop: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                ✓ Your Selected Subjects ({selectedSubjects.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedSubjects.map(subject => (
                  <span key={subject.id} style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {subject.subject_name}
                  </span>
                ))}
              </div>
            </div>
            <button 
              className="btn-primary" 
              onClick={() => {
                setNotification({ 
                  type: 'success', 
                  message: `Your ${selectedSubjects.length} selected subject(s) are already saved!` 
                })
                setTimeout(() => setNotification(null), 3000)
              }}
              style={{ 
                background: 'white',
                color: '#667eea',
                border: 'none',
                padding: '0.6rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              💾 Save Selection
            </button>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {generated && (
        <div className="results-summary">
          <p>Showing {apiResults.length} recommended subjects</p>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="subjects-grid">
        {(generated ? apiResults : []).map(item => {
          const name = item.recommend_subject || item['Recommend course'] || item.name || 'Recommended Subject';
          const code = item.code || (name ? name.slice(0, 6).toUpperCase() : 'SUBJ');
          const category = item.category || '—';
          const units = item.units || 2;
          const difficulty = item.difficulty || 'Medium';
          const description = item.description || item.reasoning || item.Reasoning || 'Recommended by AI based on your interests.';
          const atarContribution = item.atarContribution || '—';
          const examType = item.examType || '—';
          const practicalWork = item.practicalWork || '—';
          const popularity = item.popularity;
          const recommendedFor = item.recommendedFor || [];
          const careerPaths = item.careerPaths || [];
          return (
            <div 
              key={code + name} 
              className={`subject-card ${isSubjectSelected(item) ? 'selected' : ''}`}
              style={{ 
                cursor: 'pointer',
                border: isSubjectSelected(item) ? '3px solid #667eea' : '1px solid #e2e8f0',
                boxShadow: isSubjectSelected(item) ? '0 4px 12px rgba(102, 126, 234, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
              onClick={(e) => {
                // Don't trigger if clicking on checkbox or its container
                if (e.target.type === 'checkbox' || e.target.closest('input[type="checkbox"]')) {
                  return
                }
                toggleSubjectSelection(item)
              }}
            >
              <div className="subject-header">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                  <input
                    type="checkbox"
                    checked={isSubjectSelected(item)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleSubjectSelection(item)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      marginTop: '0.2rem',
                      cursor: 'pointer',
                      accentColor: '#667eea'
                    }}
                  />
                  <div className="subject-title">
                    <h3>{name}</h3>
                  </div>
                </div>
                <div className="subject-badges">
                  <span className="category-tag">{category}</span>
                  <span className="units-badge">{units} units</span>
                </div>
              </div>

              {/* Clearly separated, highlighted Reason label and content as two distinct areas */}
              {(item.reasoning || item.Reasoning) && (
                <div style={{ margin: '0.8rem 0 2.2rem 0' }}>
                  <div className="reason-label" style={{
                    display: 'inline-flex', alignItems: 'center', fontWeight: 800, fontSize: '0.9rem',
                    color: '#205389', background: '#c7e8f3', borderRadius: '0.9em', padding: '0.31em 1.1em', boxShadow: '0 1px 5px #bad2ff40', marginBottom: '0.95em',
                  }}>
                    <span className="reason-icon" style={{ fontSize: '0.8em', marginRight: '0.48em' }}>💡</span>
                    Reason
                  </div>
                  <div className="reason-area" style={{
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(90deg, #e0ecfe 70%, #ffe7cf 100%)',
                    borderRadius: '1.4rem',
                    boxShadow: '0 4px 18px #b4cafa40',
                    border: '2px solid #7ab2f7',
                    fontSize: '1.25rem', fontWeight: 700, color: '#12528f',
                  }}>{item.reasoning || item.Reasoning}</div>
                </div>
              )}

              {/* All other details below, not grouped with Reason section */}
              <p className="subject-description">{description}</p>

              {/* Detail grid */}
              <div className="subject-details">
                <div className="detail-row">
                  <span className="detail-label">ATAR Contribution:</span>
                  <span className="detail-value atar-contribution">{atarContribution}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Exam Type:</span>
                  <span className="detail-value">{examType}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Practical Work:</span>
                  <span className="detail-value">{practicalWork}</span>
                </div>
              </div>

              {/* Popularity Bar */}
              {typeof popularity === 'number' && (
                <div className="subject-footer">
                  <div className="popularity-indicator">
                    <span className="popularity-label">Popularity:</span>
                    <div className="popularity-bar">
                      <div
                        className="popularity-fill"
                        style={{ width: `${popularity}%` }}
                      ></div>
                    </div>
                    <span className="popularity-value">{popularity}%</span>
                  </div>
                </div>
              )}

              {/* Career Paths */}
              {careerPaths.length > 0 && (
                <div className="career-paths">
                  <span className="career-label">Career Paths:</span>
                  <div className="career-tags">
                    {careerPaths.map((path, index) => (
                      <span key={index} className="career-tag">{path}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended for */}
              {recommendedFor.length > 0 && (
                <div className="recommended-for">
                  <span className="recommended-label">Recommended for:</span>
                  <ul className="recommended-list">
                    {recommendedFor.slice(0, 3).map((item, index) => (
                      <li key={index}><span className="check-icon">✓</span>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {generated && apiResults.length === 0 && (
        <div className="no-results">
          <h3>No recommended subjects returned</h3>
          <p>Try different interest keywords or broaden your input.</p>
        </div>
      )}
    </div>
  )
}

export default HSCSubjectRecommendation
