import { useEffect, useState } from 'react'
import studentApi from '../../services/studentApi'
import './ClassDetailPage.css'

function ClassDetailPage({ classData, onBack, onAssignmentClick }) {
  const [activeSection, setActiveSection] = useState('overview')
  const [modules, setModules] = useState([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)

  const fetchModules = async () => {
    if (!classData?.id) return
    setLoadingModules(true)
    try {
      const res = await studentApi.getClassModules(classData.id)
      setModules(res.modules || [])
    } catch (e) {
      console.error('Failed to load modules', e)
    } finally {
      setLoadingModules(false)
    }
  }

  const fetchAssignments = async () => {
    if (!classData?.id) return
    setLoadingAssignments(true)
    try {
      const res = await studentApi.getAssignments()
      // Filter assignments for this specific class
      const classAssignments = (res.assignments || []).filter(a => a.classId === classData.id)
      setAssignments(classAssignments)
    } catch (e) {
      console.error('Failed to load assignments', e)
    } finally {
      setLoadingAssignments(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'materials') {
      fetchModules()
    } else if (activeSection === 'assignments') {
      fetchAssignments()
    }
  }, [activeSection, classData?.id])

  if (!classData) {
    return (
      <div className="class-detail-page">
        <button className="btn-back" onClick={onBack}>
          ← Back to Classes
        </button>
        <p>Class not found</p>
      </div>
    )
  }

  return (
    <div className="class-detail-page">
      {/* Header */}
      <div className="detail-page-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Classes
        </button>
        <div className="class-detail-hero" style={{ borderLeft: `6px solid ${classData.color}` }}>
          <div className="class-detail-info">
            <div className="class-icon-large" style={{ background: `${classData.color}20`, color: classData.color }}>
              📚
            </div>
            <div>
              <h1 className="class-detail-title">{classData.name}</h1>
              <p className="class-detail-code">{classData.code}</p>
              <p className="class-detail-teacher">👨‍🏫 {classData.teacher}</p>
            </div>
          </div>
          <div className="class-detail-stats-row">
            <div className="stat-box">
              <span className="stat-label">Grade</span>
              <span className="stat-value-large" style={{ color: classData.color }}>{classData.studentAvgGrade}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Progress</span>
              <span className="stat-value-large" style={{ color: classData.color }}>{classData.progress}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Assignments</span>
              <span className="stat-value-large" style={{ color: classData.color }}>{classData.upcomingAssignments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="detail-tabs">
        <button 
          className={`detail-tab ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          Overview
        </button>
        <button 
          className={`detail-tab ${activeSection === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveSection('assignments')}
        >
          Assignments
        </button>
        <button 
          className={`detail-tab ${activeSection === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveSection('materials')}
        >
          Modules
        </button>
        <button 
          className={`detail-tab ${activeSection === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveSection('schedule')}
        >
          Schedule
        </button>
        <button 
          className={`detail-tab ${activeSection === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveSection('grades')}
        >
          Grades
        </button>
      </div>

      {/* Content Sections */}
      <div className="detail-content">
        {activeSection === 'overview' && (
          <div className="overview-section">
            <div className="detail-card">
              <h2>Course Description</h2>
              <p>{classData.description}</p>
            </div>

            <div className="detail-card">
              <h2>Next Class</h2>
              <div className="next-class-info">
                <div className="info-row">
                  <span className="info-icon">📅</span>
                  <span>{classData.nextClass}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">📍</span>
                  <span>{classData.location || 'Room 302, Building A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">⏱️</span>
                  <span>Duration: 50 minutes</span>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <h2>Class Progress</h2>
              <div className="progress-section">
                <div className="progress-bar-large">
                  <div 
                    className="progress-fill-large" 
                    style={{ width: `${classData.progress}%`, background: classData.color }}
                  ></div>
                </div>
                <div className="progress-details">
                  <span>Completed: {classData.progress}%</span>
                  <span>Remaining: {100 - classData.progress}%</span>
                </div>
              </div>
              <div className="milestone-list">
                <div className="milestone-item completed">
                  <span className="milestone-check">✓</span>
                  <span>Introduction to {classData.name}</span>
                </div>
                <div className="milestone-item completed">
                  <span className="milestone-check">✓</span>
                  <span>Fundamental Concepts</span>
                </div>
                <div className="milestone-item in-progress">
                  <span className="milestone-check">○</span>
                  <span>Advanced Topics</span>
                </div>
                <div className="milestone-item pending">
                  <span className="milestone-check">○</span>
                  <span>Final Review & Exam</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'assignments' && (
          <div className="assignments-section">
            <div className="detail-card">
              <h2>Class Assignments</h2>
              {loadingAssignments ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                  <p>Loading assignments...</p>
                </div>
              ) : assignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                  <p>No assignments yet for this class</p>
                </div>
              ) : (
                <div>
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="assignment-detail-card">
                      <div className="assignment-detail-header">
                        <h3>{assignment.title}</h3>
                        <span className={`status-badge ${assignment.status}`}>
                          {assignment.status}
                        </span>
                      </div>
                      <div className="assignment-detail-info">
                        <div className="info-row">
                          <span className="info-icon">📅</span>
                          <span>Due: {assignment.dueDate} at {assignment.dueTime}</span>
                        </div>
                      </div>
                      <button className="btn-view-assignment" style={{ borderColor: classData.color, color: classData.color }} onClick={() => onAssignmentClick && onAssignmentClick(assignment.id)}>
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'materials' && (
          <div className="materials-section">
            <div className="detail-card">
              <h2>📚 Course Modules</h2>
              {loadingModules ? (
                <div className="modules-loading">Loading modules...</div>
              ) : (
                <div className="modules-container">
                  {modules.length === 0 && (
                    <div className="modules-empty-state">
                      <div className="modules-empty-icon">📦</div>
                      <p>No modules available yet</p>
                    </div>
                  )}
                  {modules.map(mod => (
                    <div key={mod.id} className="student-module-card">
                      <div className="student-module-header">
                        <div className="student-module-title">{mod.title}</div>
                        {mod.description_richtext && (
                          <div className="student-module-description">{mod.description_richtext}</div>
                        )}
                      </div>
                      <div className="student-module-content">
                        {(mod.items || []).length === 0 && (
                          <div className="student-module-empty">No items in this module</div>
                        )}
                        {(mod.items || []).map(it => {
                          const itemIcon = it.item_type === 'link' ? '🔗' : it.item_type === 'file' ? '📄' : '📝';
                          return (
                            <div key={it.id} className="student-module-item">
                              <div className="student-module-item-header">
                                <span className="student-module-item-icon">{itemIcon}</span>
                                <div className="student-module-item-title">{it.title}</div>
                                <span className={`student-module-item-type ${it.item_type}`}>{it.item_type}</span>
                              </div>
                              {it.description && (
                                <div className="student-module-item-description">{it.description}</div>
                              )}
                              {it.item_type === 'link' && it.link_url && (
                                <a href={it.link_url} target="_blank" rel="noreferrer" className="student-module-item-link">
                                  {it.link_url}
                                </a>
                              )}
                              {it.item_type === 'rich_text' && it.content_richtext && (
                                <div className="student-module-item-content">{it.content_richtext}</div>
                              )}
                              {it.item_type === 'file' && it.file_public_url && (
                                <a className="btn-download" href={it.file_public_url} target="_blank" rel="noreferrer">
                                  Download File
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'schedule' && (
          <div className="schedule-section">
            <div className="detail-card">
              <h2>Weekly Schedule</h2>
              <div className="schedule-list">
                {classData.schedule?.map((session, index) => (
                  <div key={index} className="schedule-item">
                    <div className="schedule-day">{session.day}</div>
                    <div className="schedule-details">
                      <span className="schedule-time">{session.time}</span>
                      <span className="schedule-location">{session.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'grades' && (
          <div className="grades-section">
            <div className="detail-card">
              <h2>Assessment Grades</h2>
              <div className="grades-table">
                <div className="grades-header">
                  <span>Assessment</span>
                  <span>Score</span>
                  <span>Weight</span>
                  <span>Grade</span>
                </div>
                {classData.gradeHistory?.map((grade, index) => (
                  <div key={index} className="grade-row">
                    <span>{grade.assessment}</span>
                    <span>{grade.score}/{grade.maxScore}</span>
                    <span>{grade.weight}%</span>
                    <span className="grade-value" style={{ color: classData.color }}>{grade.grade}</span>
                  </div>
                ))}
              </div>
              <div className="overall-grade" style={{ background: `${classData.color}10`, borderColor: classData.color }}>
                <span>Overall Grade:</span>
                <span className="overall-grade-value" style={{ color: classData.color }}>{classData.grade}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassDetailPage

