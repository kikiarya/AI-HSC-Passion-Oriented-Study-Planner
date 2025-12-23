import { useState, useEffect } from 'react'
import studentApi from '../../services/studentApi'
import authService from '../../services/authService'
import './KnowledgeGaps.css'

function KnowledgeGaps() {
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [knowledgeGaps, setKnowledgeGaps] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('knowledgeGaps')
    return saved ? JSON.parse(saved) : null
  })
  const [performanceData, setPerformanceData] = useState(null)

  useEffect(() => {
    fetchPerformanceData()
  }, [])

  // Save to localStorage whenever knowledgeGaps changes
  useEffect(() => {
    if (knowledgeGaps) {
      localStorage.setItem('knowledgeGaps', JSON.stringify(knowledgeGaps))
    }
  }, [knowledgeGaps])

  const fetchPerformanceData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch student's grades and assignments
      const [gradesResponse, assignmentsResponse] = await Promise.all([
        studentApi.getGrades(),
        studentApi.getAssignments()
      ])
      
      setPerformanceData({
        grades: gradesResponse.grades || [],
        assignments: assignmentsResponse.assignments || []
      })
    } catch (err) {
      console.error('Failed to fetch performance data:', err)
      setError(err.message || 'Failed to load your performance data')
    } finally {
      setLoading(false)
    }
  }

  const analyzeKnowledgeGaps = async () => {
    setAnalyzing(true)
    setError(null)
    
    try {
      const user = authService.getCurrentUser()
      if (!user || !user.id) {
        throw new Error('User not authenticated. Please log in again.')
      }

      // Call actual API endpoint
      const response = await studentApi.analyzeKnowledgeGaps()
      
      // Set the knowledge gaps from API response
      setKnowledgeGaps({
        knowledge_gaps: response.knowledge_gaps || [],
        overall_analysis: response.overall_analysis || 'Analysis completed.',
        suggested_study_order: response.suggested_study_order || [],
        mock: response.mock || false,
        ai_generated: response.ai_generated || false
      })
      
    } catch (err) {
      console.error('Failed to analyze knowledge gaps:', err)
      setError(err.message || 'Failed to analyze knowledge gaps. Please try again.')
      
      // Fallback to mock data if API fails
      if (performanceData) {
        const mockGaps = generateMockAnalysis(performanceData)
        setKnowledgeGaps(mockGaps)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const generateMockAnalysis = (data) => {
    // This is a mock analysis based on performance data
    // Will be replaced with actual AI analysis when backend is ready
    
    const gaps = []
    
    if (data && data.grades && data.grades.length > 0) {
      // Group grades by subject
      const subjectGrades = {}
      data.grades.forEach(grade => {
        const subject = grade.class || grade.className || 'Unknown'
        if (!subjectGrades[subject]) {
          subjectGrades[subject] = []
        }
        subjectGrades[subject].push(grade)
      })
      
      // Analyze each subject
      Object.entries(subjectGrades).forEach(([subject, grades]) => {
        const avgScore = grades.reduce((sum, g) => sum + (g.score || 0), 0) / grades.length
        const maxScore = grades[0]?.maxScore || 100
        
        if (avgScore < maxScore * 0.7) {
          // Below 70%, identify as knowledge gap
          gaps.push({
            subject: subject,
            topic: `${subject} Fundamentals`,
            weakness_level: avgScore < maxScore * 0.5 ? 'high' : 'medium',
            evidence: `Average score: ${avgScore.toFixed(1)}/${maxScore} (${(avgScore/maxScore*100).toFixed(0)}%)`,
            recommendation: `Focus on reviewing core concepts in ${subject}. Consider additional practice exercises.`,
            related_topics: ['Core Concepts', 'Basic Skills']
          })
        }
      })
    }
    
    return {
      knowledge_gaps: gaps,
      overall_analysis: gaps.length > 0 
        ? `You have ${gaps.length} key area${gaps.length > 1 ? 's' : ''} that need attention. Focus on the high-priority items first.`
        : 'Keep up the great work! Your performance looks strong across all subjects.',
      suggested_study_order: gaps.map(g => g.topic),
      generated_at: new Date().toISOString()
    }
  }

  const getWeaknessLevelColor = (level) => {
    switch (level) {
      case 'high': return '#f56565'
      case 'medium': return '#ed8936'
      case 'low': return '#ecc94b'
      default: return '#718096'
    }
  }

  const getWeaknessLevelLabel = (level) => {
    switch (level) {
      case 'high': return 'High Priority'
      case 'medium': return 'Medium Priority'
      case 'low': return 'Low Priority'
      default: return 'Unknown'
    }
  }

  return (
    <div className="knowledge-gaps-container">
      <div className="knowledge-gaps-header">
        <div className="header-content">
          <div className="header-icon">🧠</div>
          <div>
            <h1>Knowledge Gaps Analysis</h1>
            <p>AI-powered insights into your learning weaknesses and strengths</p>
          </div>
        </div>
        {performanceData && (
          <button
            className={`analyze-btn ${analyzing ? 'analyzing' : ''}`}
            onClick={analyzeKnowledgeGaps}
            disabled={analyzing || loading}
          >
            {analyzing ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : knowledgeGaps ? (
              '🔄 Re-analyze Gaps'
            ) : (
              '✨ Analyze Knowledge Gaps'
            )}
          </button>
        )}
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your performance data...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchPerformanceData}>Retry</button>
        </div>
      )}

      {!loading && !error && !performanceData && (
        <div className="no-data-state">
          <div className="no-data-icon">📊</div>
          <p>No performance data available yet.</p>
          <p className="subtitle">Complete some assignments to get your knowledge gaps analyzed.</p>
        </div>
      )}

      {knowledgeGaps && (
        <div className="analysis-results">
          {/* Overall Analysis */}
          <div className="overall-analysis-card">
            <div className="card-header">
              <span className="card-icon">📊</span>
              <h2>Overall Analysis</h2>
            </div>
            <div className="card-content">
              <p className="analysis-text">{knowledgeGaps.overall_analysis}</p>
              <div className="analysis-stats">
                <div className="stat">
                  <div className="stat-value">{knowledgeGaps.knowledge_gaps.length}</div>
                  <div className="stat-label">Knowledge Gaps</div>
                </div>
                <div className="stat">
                  <div className="stat-value">
                    {knowledgeGaps.knowledge_gaps.filter(g => g.weakness_level === 'high').length}
                  </div>
                  <div className="stat-label">High Priority</div>
                </div>
              </div>
            </div>
          </div>

          {/* Knowledge Gaps List */}
          {knowledgeGaps.knowledge_gaps.length > 0 ? (
            <div className="gaps-list">
              <div className="section-header">
                <h2>Identified Knowledge Gaps</h2>
                <span className="gap-count">{knowledgeGaps.knowledge_gaps.length} items</span>
              </div>
              
              {knowledgeGaps.knowledge_gaps.map((gap, index) => (
                <div key={index} className="gap-card">
                  <div className="gap-header">
                    <div className="gap-main-info">
                      <h3 className="gap-subject">{gap.subject}</h3>
                      <span className="gap-topic">{gap.topic}</span>
                    </div>
                    <div
                      className="gap-priority"
                      style={{ backgroundColor: getWeaknessLevelColor(gap.weakness_level) }}
                    >
                      {getWeaknessLevelLabel(gap.weakness_level)}
                    </div>
                  </div>
                  
                  <div className="gap-evidence">
                    <strong>Evidence:</strong> {gap.evidence}
                  </div>
                  
                  <div className="gap-recommendation">
                    <strong>Recommendation:</strong> {gap.recommendation}
                  </div>
                  
                  {gap.related_topics && gap.related_topics.length > 0 && (
                    <div className="gap-related-topics">
                      <strong>Related Topics:</strong>
                      <div className="topics-tags">
                        {gap.related_topics.map((topic, idx) => (
                          <span key={idx} className="topic-tag">{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-gaps-state">
              <div className="success-icon">🎉</div>
              <h3>Great Work!</h3>
              <p>No significant knowledge gaps detected.</p>
              <p className="subtitle">Keep up the excellent performance!</p>
            </div>
          )}

          {/* Suggested Study Order */}
          {knowledgeGaps.suggested_study_order && knowledgeGaps.suggested_study_order.length > 0 && (
            <div className="study-order-card">
              <div className="card-header">
                <span className="card-icon">📚</span>
                <h2>Suggested Study Order</h2>
              </div>
              <div className="card-content">
                <p className="order-description">
                  Focus on these topics in the suggested order for maximum improvement:
                </p>
                <ol className="study-order-list">
                  {knowledgeGaps.suggested_study_order.map((topic, index) => (
                    <li key={index}>
                      <span className="step-number">{index + 1}</span>
                      <span className="step-topic">{topic}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {!knowledgeGaps && !loading && !error && performanceData && (
        <div className="intro-state">
          <div className="intro-icon">🔍</div>
          <h2>Ready to Analyze Your Knowledge Gaps?</h2>
          <p className="intro-description">
            Our AI will analyze your assignment performance and grades to identify areas where you need more practice.
          </p>
          <div className="intro-features">
            <div className="feature">
              <span className="feature-icon">📊</span>
              <div>
                <strong>Performance Analysis</strong>
                <p>Comprehensive review of your grades</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">🎯</span>
              <div>
                <strong>Targeted Recommendations</strong>
                <p>Personalized study suggestions</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-icon">📚</span>
              <div>
                <strong>Study Order</strong>
                <p>Optimized learning path</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeGaps

