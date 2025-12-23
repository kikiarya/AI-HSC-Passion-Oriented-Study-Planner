import { useState, useEffect } from 'react'
import teacherApi from '../../services/teacherApi'
import './AnalyticsView.css'

function AnalyticsView() {
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('all')
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    averageGrade: 'N/A',
    assignmentCompletion: 'N/A',
    attendanceRate: 'N/A',
    gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    totalAssignments: 0,
    totalSubmissions: 0,
    gradedSubmissions: 0,
  })

  const handleGenerateInsights = async (classId) => {
    if (!classId || classId === 'all') {
      alert('Please select a specific class to generate insights')
      return
    }

    setGenerating(true)
    try {
      const response = await teacherApi.analyzeClassPerformance(classId)
      setInsights(response)
      alert('AI Insights generated successfully!')
    } catch (error) {
      console.error('Failed to generate insights:', error)
      alert('Failed to generate AI insights. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // Fetch classes on initial load
  useEffect(() => {
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

    fetchClasses()
  }, [])

  // Fetch analytics when class selection changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await teacherApi.getAnalytics(selectedClass)
        setAnalytics(response || {
          totalStudents: 0,
          averageGrade: 'N/A',
          assignmentCompletion: 'N/A',
          attendanceRate: 'N/A',
          gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
          totalAssignments: 0,
          totalSubmissions: 0,
          gradedSubmissions: 0,
        })
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
        setAnalytics({
          totalStudents: 0,
          averageGrade: 'N/A',
          assignmentCompletion: 'N/A',
          attendanceRate: 'N/A',
          gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
          totalAssignments: 0,
          totalSubmissions: 0,
          gradedSubmissions: 0,
        })
      }
    }

    if (!loading) {
      fetchAnalytics()
    }
  }, [selectedClass, loading])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading analytics data...</p>
      </div>
    )
  }

  return (
    <div className="analytics-view">
      {/* Header */}
      <div className="analytics-header">
        <div className="class-selector">
          <label>Select Class:</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn-generate-insights" 
          onClick={() => handleGenerateInsights(selectedClass)}
          disabled={selectedClass === 'all' || !selectedClass}
        >
          <span>✨</span> Generate AI Insights
        </button>
      </div>

      {/* AI Insights Display */}
      {insights && (
        <div className="ai-insights-section">
          <h3>🤖 AI-Generated Insights</h3>
          
          {insights.insights && insights.insights.length > 0 && (
            <div className="insights-list">
              <h4>Key Insights:</h4>
              <ul>
                {insights.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.recommendations && insights.recommendations.length > 0 && (
            <div className="insights-list">
              <h4>Recommendations:</h4>
              <ul>
                {insights.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {insights.concerns && insights.concerns.length > 0 && (
            <div className="insights-list concerns">
              <h4>⚠️ Areas of Concern:</h4>
              <ul>
                {insights.concerns.map((concern, index) => (
                  <li key={index}>{concern}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="insights-stats">
            <p><strong>Class Average:</strong> {insights.class_average}%</p>
            <p><strong>Total Submissions Analyzed:</strong> {insights.total_submissions}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <h3>Total Students</h3>
          <p className="stat-value-xl">{analytics.totalStudents || 0}</p>
          <p className="stat-trend">
            {analytics.totalStudents > 0 ? `${analytics.totalStudents} enrolled` : 'No students yet'}
          </p>
        </div>

        <div className="analytics-stat-card">
          <h3>Average Grade</h3>
          <p className="stat-value-xl">{analytics.averageGrade || 'N/A'}</p>
          <p className="stat-trend">
            {analytics.averageGrade !== 'N/A' ? 'Based on graded submissions' : 'No grades yet'}
          </p>
        </div>

        <div className="analytics-stat-card">
          <h3>Assignment Completion</h3>
          <p className="stat-value-xl">{analytics.assignmentCompletion || 'N/A'}</p>
          <p className="stat-trend">
            {analytics.assignmentCompletion !== 'N/A' ? 'Completion rate' : 'No submissions yet'}
          </p>
        </div>

        <div className="analytics-stat-card">
          <h3>Attendance Rate</h3>
          <p className="stat-value-xl">{analytics.attendanceRate || 'N/A'}</p>
          <p className="stat-trend">
            {analytics.attendanceRate !== 'N/A' ? 'Average attendance' : 'No data yet'}
          </p>
        </div>
      </div>

      {/* Grade Distribution */}
      {analytics.gradeDistribution && analytics.gradedSubmissions > 0 && (
        <div className="analytics-section">
          <h2>Grade Distribution</h2>
          <div className="detail-card">
            <div className="grade-distribution">
              {Object.entries(analytics.gradeDistribution).map(([grade, count]) => {
                const percentage = analytics.gradedSubmissions > 0 
                  ? Math.round((count / analytics.gradedSubmissions) * 100) 
                  : 0;
                const colors = {
                  A: '#48bb78', // green
                  B: '#4299e1', // blue
                  C: '#ed8936', // orange
                  D: '#f56565', // red
                  F: '#9f7aea'  // purple
                };
                
                return (
                  <div key={grade} className="grade-dist-item">
                    <div className="grade-dist-header">
                      <span className="grade-label" style={{ color: colors[grade] }}>
                        Grade {grade}
                      </span>
                      <span className="grade-count">{count} ({percentage}%)</span>
                    </div>
                    <div className="grade-dist-bar">
                      <div 
                        className="grade-dist-fill" 
                        style={{ 
                          width: `${percentage}%`,
                          background: colors[grade]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Additional Statistics */}
      {(analytics.totalAssignments > 0 || analytics.totalSubmissions > 0) && (
        <div className="analytics-section">
          <h2>Assignment Statistics</h2>
          <div className="analytics-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="analytics-stat-card">
              <h3>Total Assignments</h3>
              <p className="stat-value-xl">{analytics.totalAssignments || 0}</p>
            </div>
            <div className="analytics-stat-card">
              <h3>Total Submissions</h3>
              <p className="stat-value-xl">{analytics.totalSubmissions || 0}</p>
            </div>
            <div className="analytics-stat-card">
              <h3>Graded Submissions</h3>
              <p className="stat-value-xl">{analytics.gradedSubmissions || 0}</p>
            </div>
            {analytics.totalSubmissions > 0 && (
              <div className="analytics-stat-card">
                <h3>Grading Progress</h3>
                <p className="stat-value-xl">
                  {Math.round((analytics.gradedSubmissions / analytics.totalSubmissions) * 100)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsView
