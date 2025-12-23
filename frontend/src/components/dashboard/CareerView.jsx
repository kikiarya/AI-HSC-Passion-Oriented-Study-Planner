import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateCareerPathway } from '../../services/careerService'

function CareerView({ careerRecommendations }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [careerData, setCareerData] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('careerData')
    return saved ? JSON.parse(saved) : null
  })

  // User prompt inputs
  const [interests, setInterests] = useState(() => {
    const saved = localStorage.getItem('careerInterests')
    return saved || ''
  })
  const [strengths, setStrengths] = useState(() => {
    const saved = localStorage.getItem('careerStrengths')
    return saved || ''
  })
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('careerGoals')
    return saved || ''
  })

  // Save to localStorage whenever careerData or inputs change
  useEffect(() => {
    if (careerData) {
      localStorage.setItem('careerData', JSON.stringify(careerData))
    }
  }, [careerData])

  useEffect(() => {
    if (interests !== '') {
      localStorage.setItem('careerInterests', interests)
    }
  }, [interests])

  useEffect(() => {
    if (strengths !== '') {
      localStorage.setItem('careerStrengths', strengths)
    }
  }, [strengths])

  useEffect(() => {
    if (goals !== '') {
      localStorage.setItem('careerGoals', goals)
    }
  }, [goals])

  const prompt = useMemo(() => {
    const i = interests?.trim() || 'software, data, design'
    const s = strengths?.trim() || 'problem-solving, teamwork'
    const g = goals?.trim() || 'enter a university degree and work in tech'
    return (
      `Student interests: ${i}\n` +
      `Strengths: ${s}\n` +
      `Goals: ${g}`
    )
  }, [interests, strengths, goals])

  const handleGenerate = async () => {
    setError('')
    setLoading(true)
    try {
      const data = await generateCareerPathway({ prompt })
      setCareerData(data)
    } catch (e) {
      setError(e?.message || 'Failed to generate career pathway')
    } finally {
      setLoading(false)
    }
  }

  const cards = useMemo(() => {
    if (careerData?.career_pathways?.length) {
      return careerData.career_pathways.map((p, i) => ({
        id: i + 1,
        career: p.title,
        match: 100,
        reason: interests ? `Aligned with your interests: ${interests}` : 'Recommended by AI analysis',
        averageSalary: p.salary_range?.[0] || '—',
        growthRate: p['job growth'] || '—'
      }))
    }
    return careerRecommendations || []
  }, [careerData, careerRecommendations, interests])

  return (
    <>
      <div className="ai-header">
        <div className="ai-icon-large">🎯</div>
        <div>
          <h2>AI Career Recommendations</h2>
          <p>Generate your own career paths based on your interests, strengths and goals</p>
        </div>
      </div>

      <div className="filters-row" style={{ alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Interests</label>
          <input
            type="text"
            className="search-input"
            placeholder="e.g., software, health, design"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            onBlur={(e) => setInterests(e.target.value.trim())}
            aria-label="Student interests"
            autoComplete="off"
          />
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Strengths</label>
          <input
            type="text"
            className="search-input"
            placeholder="e.g., problem-solving, creativity"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            onBlur={(e) => setStrengths(e.target.value.trim())}
            aria-label="Student strengths"
            autoComplete="off"
          />
        </div>
        <div className="filter-group" style={{ flex: 1 }}>
          <label>Goals</label>
          <input
            type="text"
            className="search-input"
            placeholder="e.g., enter CS degree, start apprenticeship"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            onBlur={(e) => setGoals(e.target.value.trim())}
            aria-label="Student goals"
            autoComplete="off"
          />
        </div>
        <div className="filter-group" style={{ width: '240px' }}>
          <label style={{ visibility: 'hidden' }}>Generate</label>
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <span className="spinner"></span>
                Generating…
              </span>
            ) : (
              '✨ Generate Career Path'
            )}
          </button>
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}

      <div className="career-recommendations">
        {cards.map((career, idx) => (
          <div key={career.id || idx} className="career-card">
            <div className="career-match">
              <div className="match-circle">
                <svg className="match-progress" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#667eea" 
                    strokeWidth="10"
                    strokeDasharray={`${(career.match || 100) * 2.827} 282.7`}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="match-percentage">{career.match || 100}%</div>
              </div>
            </div>
            <div className="career-info">
              <h3>{career.career}</h3>
              {career.reason && <p className="career-reason">✨ {career.reason}</p>}
              <div className="career-details">
                <div className="career-detail-item">
                  <span className="detail-label">Salary Range</span>
                  <span className="detail-value">{career.averageSalary}</span>
                </div>
                <div className="career-detail-item">
                  <span className="detail-label">Job Growth</span>
                  <span className="detail-value growth">{career.growthRate}</span>
                </div>
              </div>
              <button
                className="btn-career-action"
                onClick={() => {
                  if (careerData) {
                    navigate('/student/career-pathway', { state: { careerData, selectedPathwayIndex: idx } })
                  }
                }}
                disabled={!careerData}
                title={!careerData ? 'Generate to see full details' : 'View details'}
              >
                Learn More
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="dashboard-section">
        <h3>Career Resources</h3>
        <div className="resources-grid">
          <div className="resource-card">
            <span className="resource-icon">📚</span>
            <h4>Career Guides</h4>
            <p>Explore detailed guides for different career paths</p>
          </div>
          <div className="resource-card">
            <span className="resource-icon">🎓</span>
            <h4>University Pathways</h4>
            <p>Find the right courses for your career goals</p>
          </div>
          <div className="resource-card">
            <span className="resource-icon">💼</span>
            <h4>Industry Insights</h4>
            <p>Stay updated with industry trends and opportunities</p>
          </div>
        </div>
      </section>
    </>
  )
}

export default CareerView


