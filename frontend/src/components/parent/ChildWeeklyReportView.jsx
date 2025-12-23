import { useState, useEffect } from 'react'
import { generateWeeklyReport, transformWeeklyReport } from '../../services/weeklyReportService.js'

function ChildWeeklyReportView({ studentId }) {
  const [report, setReport] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [weekStart, setWeekStart] = useState(() => {
    // Default to start of current week (Monday)
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday.toISOString().split('T')[0]
  })
  const [weekEnd, setWeekEnd] = useState(() => {
    // Default to end of current week (Sunday)
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? 0 : 7) // Adjust when day is Sunday
    const sunday = new Date(today.setDate(diff))
    sunday.setHours(23, 59, 59, 999)
    return sunday.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (studentId) {
      generateReport()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, weekEnd, studentId])

  const generateReport = async () => {
    if (!studentId) {
      setError('No student selected')
      return
    }

    setIsGenerating(true)
    setError(null)
    
    try {
      // Call API to generate weekly report with parent endpoint
      const apiReport = await generateWeeklyReport({
        student_id: studentId,
        report_week_start: weekStart,
        report_week_end: weekEnd,
        useStudentEndpoint: false // Use ai-agent endpoint since we're calling from parent
      })

      console.log('API Report:', apiReport)

      // Transform API response to component format
      const transformedReport = transformWeeklyReport(apiReport)
      setReport(transformedReport)
    } catch (err) {
      console.error('Error generating weekly report:', err)
      setError(err.message || 'Failed to generate weekly report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#f56565'
      case 'Medium': return '#ed8936'
      case 'Low': return '#48bb78'
      default: return '#718096'
    }
  }

  if (isGenerating) {
    return (
      <div className="weekly-report-container">
        <div className="generating-report">
          <div className="loading-spinner"></div>
          <h3>Generating Weekly Report...</h3>
          <p>Analyzing your child's study patterns and performance</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="weekly-report-container">
        <div className="error-state">
          <h3>Unable to generate report</h3>
          <p>{error}</p>
          <button onClick={generateReport} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!report) {
    return null
  }

  return (
    <div className="weekly-report-container">
      {/* Header */}
      <div className="report-header">
        <div className="header-content">
          <h2>📊 Weekly Study Report for {report.studentName}</h2>
          <p className="report-week">{report.week}</p>
          <p className="report-generated">Generated on {new Date(report.generatedAt).toLocaleDateString()}</p>
        </div>
        <div className="header-actions">
          <div className="date-range-selector">
            <div className="date-input-group">
              <label>Week Start:</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>Week End:</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="date-input"
              />
            </div>
          </div>
          <button className="btn-refresh" onClick={generateReport}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Top 3 Focus Areas */}
      {report.topFocusAreas && report.topFocusAreas.length > 0 && (
        <div className="report-section">
          <h3>🎯 Top 3 Focus Areas for Next Week</h3>
          <div className="focus-areas">
            {report.topFocusAreas.map((area, index) => (
              <div key={index} className="focus-area-card">
                <div className="focus-header">
                  <span className="focus-number">{index + 1}</span>
                  <h4>
                    {area.subject}
                  </h4>
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(area.priority) }}
                  >
                    {area.priority} Priority
                  </span>
                </div>
                <p className="focus-reason">{area.reason}</p>
                <p className="focus-recommendation">{area.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      <div className="report-section">
        <h3>📋 Executive Summary</h3>
        <div className="study-summary">
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <span className="stat-value">{report.overallSummary?.studyHours || 'N/A'}</span>
                <span className="stat-label">Study Hours</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <span className="stat-value">{report.overallSummary?.assignmentsCompleted || 'N/A'}</span>
                <span className="stat-label">Assignments Completed</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-value">{report.overallSummary?.averageGrade || 'N/A'}</span>
                <span className="stat-label">Average Grade</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <span className="stat-value">{report.overallSummary?.attendance || 'N/A'}</span>
                <span className="stat-label">Attendance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Study Time Summary */}
      {report.studyTimeSummary && report.studyTimeSummary.length > 0 && (
        <div className="report-section">
          <h3>⏰ Study Time Summary</h3>
          <div className="study-summary">
            <div className="summary-stats">
              {report.studyTimeSummary.map((subject, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-content">
                    <span className="stat-value">{subject.hours}h</span>
                    <span className="stat-label">{subject.subject}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grade History */}
      <div className="report-section">
        <h3>📊 Grade History</h3>
        <div className="grade-history-list">
          {report.gradeHistory && report.gradeHistory.length > 0 ? (
            report.gradeHistory.map((grade, index) => (
              <div key={index} className="grade-item">
                <div className="grade-info">
                  <h4>{grade.assessment}</h4>
                  <span className="grade-subject">{grade.course_name}</span>
                </div>
                <div className="grade-details">
                  <div className="grade-scores">
                    <span className="grade-score">{grade.score}</span>
                    <span className="grade-separator">/</span>
                    <span className="grade-max">{grade.max_score}</span>
                    {grade.percentage !== null && (
                      <span className="grade-percentage">({grade.percentage}%)</span>
                    )}
                  </div>
                  {grade.grade && (
                    <span className="grade-letter">{grade.grade}</span>
                  )}
                </div>
                {grade.feedback && (
                  <div className="grade-feedback">
                    <strong>Feedback:</strong> {grade.feedback}
                  </div>
                )}
                {grade.created_at && (
                  <div className="grade-date">
                    {new Date(grade.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No grade history available for this week
            </p>
          )}
        </div>
      </div>

      {/* Subject Breakdown */}
      {report.subjects && report.subjects.length > 0 && (
        <div className="report-section">
          <h3>📖 Subject Breakdown</h3>
          <div className="subjects-breakdown">
            {report.subjects.map((subject, index) => (
              <div key={index} className="subject-card">
                <div className="subject-header">
                  <h4>
                    {subject.name}
                  </h4>
                  <span className="study-time">{subject.studyTime}h</span>
                </div>
                <div className="subject-details">
                  <div className="detail-item">
                    <span className="detail-label">Sessions:</span>
                    <span className="detail-value">{subject.sessions}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Studied:</span>
                    <span className="detail-value">{new Date(subject.lastStudied).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Progress:</span>
                    <span className="detail-value">{subject.progress}%</span>
                  </div>
                </div>
                {subject.topics && subject.topics.length > 0 && (
                  <div className="topics-list">
                    <span className="topics-label">Topics covered:</span>
                    <div className="topics-tags">
                      {subject.topics.map((topic, topicIndex) => (
                        <span key={topicIndex} className="topic-tag">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}
                {subject.feedback && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                    <strong>Teacher Feedback:</strong> {subject.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Insights */}
      {report.insights && report.insights.length > 0 && (
        <div className="report-section">
          <h3>💡 Weekly Insights</h3>
          <div className="insights-list">
            {report.insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-icon">
                  {insight.type === 'warning' && '⚠️'}
                  {insight.type === 'urgent' && '🚨'}
                  {insight.type === 'info' && 'ℹ️'}
                </div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChildWeeklyReportView

