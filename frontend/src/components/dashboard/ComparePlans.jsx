import { useState, useEffect } from 'react'

function ComparePlans() {
  const [studyPlans, setStudyPlans] = useState([])
  const [selectedPlans, setSelectedPlans] = useState([])
  const [showComparison, setShowComparison] = useState(false)
  
  useEffect(() => {
    // TODO: Load study plans from Supabase API
    setStudyPlans([])
  }, [])

  const handlePlanSelection = (planId, position) => {
    const newSelectedPlans = [...selectedPlans]
    newSelectedPlans[position] = planId
    setSelectedPlans(newSelectedPlans)
  }

  const getMetricColor = (value) => {
    if (value >= 80) return '#f56565'
    if (value >= 60) return '#ed8936'
    if (value >= 40) return '#ecc94b'
    return '#48bb78'
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'High': return '#f56565'
      case 'Medium': return '#ed8936'
      case 'Low': return '#48bb78'
      default: return '#718096'
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#f56565'
      case 'Medium': return '#ed8936'
      case 'Low': return '#48bb78'
      default: return '#718096'
    }
  }

  const getDifferenceIndicator = (diff) => {
    if (diff > 0) return { symbol: '↑', color: '#f56565', text: 'Higher' }
    if (diff < 0) return { symbol: '↓', color: '#48bb78', text: 'Lower' }
    return { symbol: '=', color: '#718096', text: 'Same' }
  }

  const calculatePlanMetrics = (plan) => {
    return {
      workload: plan.weeklyHours * 5 || 0,
      difficulty: plan.difficulty === 'High' ? 85 : plan.difficulty === 'Medium' ? 60 : 35,
      risk: plan.riskLevel === 'High' ? 80 : plan.riskLevel === 'Medium' ? 50 : 25
    }
  }

  const getPlanDifferences = (plan1, plan2) => {
    const metrics1 = calculatePlanMetrics(plan1)
    const metrics2 = calculatePlanMetrics(plan2)
    return {
      workload: metrics2.workload - metrics1.workload,
      difficulty: metrics2.difficulty - metrics1.difficulty,
      risk: metrics2.risk - metrics1.risk,
      hours: plan2.weeklyHours - plan1.weeklyHours
    }
  }

  const plan1 = studyPlans.find(p => p.id === selectedPlans[0])
  const plan2 = studyPlans.find(p => p.id === selectedPlans[1])
  const metrics1 = plan1 ? calculatePlanMetrics(plan1) : null
  const metrics2 = plan2 ? calculatePlanMetrics(plan2) : null
  const differences = (plan1 && plan2) ? getPlanDifferences(plan1, plan2) : null

  if (studyPlans.length === 0) {
    return (
      <div className="compare-plans-container">
        <div className="compare-header">
          <div className="header-content">
            <h2>⚖️ Compare Study Plans</h2>
            <p>No study plans available yet. Create study plans to compare them.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!showComparison) {
    return (
      <div className="compare-plans-container">
        {/* Header */}
        <div className="compare-header">
          <div className="header-content">
            <h2>⚖️ Compare Study Plans</h2>
            <p>Select two plans to compare side-by-side and find the best fit for you</p>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="plan-selection-section">
          <h3>Available Study Plans</h3>
          <div className="plans-grid">
            {studyPlans.map(plan => {
              const metrics = calculatePlanMetrics(plan)
              return (
                <div key={plan.id} className="plan-preview-card">
                  <div className="plan-preview-header">
                    <h4>{plan.name}</h4>
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(plan.difficulty) }}
                    >
                      {plan.difficulty}
                    </span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                  
                  <div className="plan-quick-stats">
                    <div className="quick-stat">
                      <span className="stat-label">Weekly Hours:</span>
                      <span className="stat-value">{plan.weeklyHours}h</span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-label">Success Rate:</span>
                      <span className="stat-value">{plan.successRate}%</span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-label">Risk Level:</span>
                      <span 
                        className="stat-value"
                        style={{ color: getRiskColor(plan.riskLevel) }}
                      >
                        {plan.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="plan-metrics-preview">
                    <div className="metric-bar">
                      <span className="metric-label">Workload</span>
                      <div className="metric-bar-bg">
                        <div 
                          className="metric-bar-fill"
                          style={{ 
                            width: `${metrics.workload}%`,
                            backgroundColor: getMetricColor(metrics.workload)
                          }}
                        ></div>
                      </div>
                      <span className="metric-value">{metrics.workload}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Comparison Selection */}
        <div className="comparison-selection">
          <h3>Select Plans to Compare</h3>
          <div className="selection-controls">
            <div className="plan-selector">
              <label>Plan 1:</label>
              <select 
                value={selectedPlans[0]} 
                onChange={(e) => handlePlanSelection(parseInt(e.target.value), 0)}
              >
                {studyPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>
            
            <div className="vs-divider">VS</div>
            
            <div className="plan-selector">
              <label>Plan 2:</label>
              <select 
                value={selectedPlans[1]} 
                onChange={(e) => handlePlanSelection(parseInt(e.target.value), 1)}
              >
                {studyPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            className="btn-compare"
            onClick={() => setShowComparison(true)}
            disabled={selectedPlans[0] === selectedPlans[1]}
          >
            Compare Plans
          </button>
          {selectedPlans[0] === selectedPlans[1] && (
            <p className="error-message">Please select two different plans to compare</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="compare-plans-container">
      {/* Header with Back Button */}
      <div className="compare-header">
        <button 
          className="btn-back"
          onClick={() => setShowComparison(false)}
        >
          ← Back to Selection
        </button>
        <h2>⚖️ Plan Comparison</h2>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="comparison-view">
        {/* Plan 1 */}
        <div className="plan-column">
          <div className="plan-header">
            <h3>{plan1.name}</h3>
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(plan1.difficulty) }}
            >
              {plan1.difficulty}
            </span>
          </div>
          <p className="plan-description">{plan1.description}</p>

          {/* Key Metrics */}
          <div className="metrics-section">
            <h4>📊 Key Metrics</h4>
            <div className="metric-item">
              <span className="metric-label">Workload</span>
              <div className="metric-bar-bg">
                <div 
                  className="metric-bar-fill"
                  style={{ 
                    width: `${metrics1.workload}%`,
                    backgroundColor: getMetricColor(metrics1.workload)
                  }}
                ></div>
              </div>
              <span className="metric-value">{metrics1.workload}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Difficulty</span>
              <div className="metric-bar-bg">
                <div 
                  className="metric-bar-fill"
                  style={{ 
                    width: `${metrics1.difficulty}%`,
                    backgroundColor: getMetricColor(metrics1.difficulty)
                  }}
                ></div>
              </div>
              <span className="metric-value">{metrics1.difficulty}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Risk</span>
              <div className="metric-bar-bg">
                <div 
                  className="metric-bar-fill"
                  style={{ 
                    width: `${metrics1.risk}%`,
                    backgroundColor: getMetricColor(metrics1.risk)
                  }}
                ></div>
              </div>
              <span className="metric-value">{metrics1.risk}%</span>
            </div>
          </div>

          {/* Study Hours */}
          <div className="hours-section">
            <h4>⏰ Study Time</h4>
            <div className="hours-display">
              <span className="hours-value">{plan1.weeklyHours}</span>
              <span className="hours-label">hours/week</span>
            </div>
          </div>

          {/* Subjects */}
          <div className="subjects-section">
            <h4>📚 Subjects</h4>
            <div className="subjects-list">
              {plan1.subjects.map((subject, index) => (
                <div key={index} className="subject-item">
                  <span className="subject-name">{subject.name}</span>
                  <span className="subject-hours">{subject.hours}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="strengths-section">
            <h4>✅ Strengths</h4>
            <ul className="strengths-list">
              {plan1.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="weaknesses-section">
            <h4>⚠️ Weaknesses</h4>
            <ul className="weaknesses-list">
              {plan1.weaknesses.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
          </div>

          {/* Additional Info */}
          <div className="additional-info">
            <div className="info-item">
              <span className="info-label">Success Rate:</span>
              <span className="info-value">{plan1.successRate}%</span>
            </div>
            <div className="info-item">
              <span className="info-label">Stress Level:</span>
              <span className="info-value">{plan1.stress}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Flexibility:</span>
              <span className="info-value">{plan1.flexibility}</span>
            </div>
          </div>

          <div className="recommended-for">
            <h4>👤 Recommended For</h4>
            <p>{plan1.recommendedFor}</p>
          </div>
        </div>

        {/* Differences Column */}
        <div className="differences-column">
          <h3>📊 Key Differences</h3>
          
          <div className="difference-item">
            <span className="diff-label">Workload</span>
            <div className="diff-indicator">
              <span 
                className="diff-symbol"
                style={{ color: getDifferenceIndicator(differences.workload).color }}
              >
                {getDifferenceIndicator(differences.workload).symbol}
              </span>
              <span className="diff-value">
                {Math.abs(differences.workload)}%
              </span>
            </div>
            <span className="diff-text">
              {getDifferenceIndicator(differences.workload).text}
            </span>
          </div>

          <div className="difference-item">
            <span className="diff-label">Difficulty</span>
            <div className="diff-indicator">
              <span 
                className="diff-symbol"
                style={{ color: getDifferenceIndicator(differences.difficulty).color }}
              >
                {getDifferenceIndicator(differences.difficulty).symbol}
              </span>
              <span className="diff-value">
                {Math.abs(differences.difficulty)}%
              </span>
            </div>
            <span className="diff-text">
              {getDifferenceIndicator(differences.difficulty).text}
            </span>
          </div>

          <div className="difference-item">
            <span className="diff-label">Risk</span>
            <div className="diff-indicator">
              <span 
                className="diff-symbol"
                style={{ color: getDifferenceIndicator(differences.risk).color }}
              >
                {getDifferenceIndicator(differences.risk).symbol}
              </span>
              <span className="diff-value">
                {Math.abs(differences.risk)}%
              </span>
            </div>
            <span className="diff-text">
              {getDifferenceIndicator(differences.risk).text}
            </span>
          </div>

          <div className="difference-item">
            <span className="diff-label">Weekly Hours</span>
            <div className="diff-indicator">
              <span 
                className="diff-symbol"
                style={{ color: getDifferenceIndicator(differences.hours).color }}
              >
                {getDifferenceIndicator(differences.hours).symbol}
              </span>
              <span className="diff-value">
                {Math.abs(differences.hours)}h
              </span>
            </div>
            <span className="diff-text">
              {getDifferenceIndicator(differences.hours).text}
            </span>
          </div>

          <div className="comparison-summary">
            <h4>💡 Summary</h4>
            {differences.workload > 20 && (
              <p className="warning">⚠️ Plan 2 has significantly higher workload</p>
            )}
            {differences.risk > 30 && (
              <p className="warning">⚠️ Plan 2 carries higher risk</p>
            )}
            {differences.difficulty > 20 && (
              <p className="warning">⚠️ Plan 2 is considerably more difficult</p>
            )}
            {Math.abs(differences.workload) < 10 && Math.abs(differences.difficulty) < 10 && (
              <p className="info">ℹ️ These plans are fairly similar in intensity</p>
            )}
          </div>
        </div>

        {/* Plan 2 */}
        <div className="plan-column">
          <div className="plan-header">
            <h3>{plan2.name}</h3>
            <span 
              className="difficulty-badge"
              style={{ backgroundColor: getDifficultyColor(plan2.difficulty) }}
            >
              {plan2.difficulty}
            </span>
          </div>
          <p className="plan-description">{plan2.description}</p>

          {/* Key Metrics */}
          <div className="metrics-section">
            <h4>📊 Key Metrics</h4>
            <div className="metric-item">
              <span className="metric-label">Workload</span>
              <div className="metric-bar-bg">
                <div 
                  className="metric-bar-fill"
                  style={{ 
                    width: `${metrics2.workload}%`,
                    backgroundColor: getMetricColor(metrics2.workload)
                  }}
                ></div>
              </div>
              <span className="metric-value">{metrics2.workload}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Difficulty</span>
              <div className="metric-bar-bg">
                <div 
                  className="metric-bar-fill"
                  style={{ 
                    width: `${metrics2.difficulty}%`,
                    backgroundColor: getMetricColor(metrics2.difficulty)
                  }}
                ></div>
              </div>
              <span className="metric-value">{metrics2.difficulty}%</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Risk</span>
              <div className="metric-bar-bg">
                <div 
                  className="metric-bar-fill"
                  style={{ 
                    width: `${metrics2.risk}%`,
                    backgroundColor: getMetricColor(metrics2.risk)
                  }}
                ></div>
              </div>
              <span className="metric-value">{metrics2.risk}%</span>
            </div>
          </div>

          {/* Study Hours */}
          <div className="hours-section">
            <h4>⏰ Study Time</h4>
            <div className="hours-display">
              <span className="hours-value">{plan2.weeklyHours}</span>
              <span className="hours-label">hours/week</span>
            </div>
          </div>

          {/* Subjects */}
          <div className="subjects-section">
            <h4>📚 Subjects</h4>
            <div className="subjects-list">
              {plan2.subjects.map((subject, index) => (
                <div key={index} className="subject-item">
                  <span className="subject-name">{subject.name}</span>
                  <span className="subject-hours">{subject.hours}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="strengths-section">
            <h4>✅ Strengths</h4>
            <ul className="strengths-list">
              {plan2.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="weaknesses-section">
            <h4>⚠️ Weaknesses</h4>
            <ul className="weaknesses-list">
              {plan2.weaknesses.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
          </div>

          {/* Additional Info */}
          <div className="additional-info">
            <div className="info-item">
              <span className="info-label">Success Rate:</span>
              <span className="info-value">{plan2.successRate}%</span>
            </div>
            <div className="info-item">
              <span className="info-label">Stress Level:</span>
              <span className="info-value">{plan2.stress}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Flexibility:</span>
              <span className="info-value">{plan2.flexibility}</span>
            </div>
          </div>

          <div className="recommended-for">
            <h4>👤 Recommended For</h4>
            <p>{plan2.recommendedFor}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComparePlans
