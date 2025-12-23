import { useLocation, useNavigate } from 'react-router-dom'
import './StudentDashboard.css'

function CareerResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { careerData, selectedPathwayIndex = 0 } = location.state || {}

  if (!careerData) {
    return (
      <div className="dashboard-main" style={{ padding: '2rem' }}>
        <button className="btn-primary" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
        <div className="error-text" style={{ marginTop: '1rem' }}>No career data found. Please generate a pathway first.</div>
      </div>
    )
  }

  const pathways = careerData.career_pathways || []
  const subjects = careerData.recommended_subjects || []
  const action = careerData.action_plan || []
  const resources = careerData.resources || []
  const selectedPathway = pathways[selectedPathwayIndex] || null

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-dashboard" onClick={() => navigate('/')}> 
            <span className="logo-icon">⚡</span>
            <span className="logo-text">HSC Power</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/student/dashboard')}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Back to Dashboard</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => navigate(-1)}>
            <span className="nav-icon">⬅️</span>
            <span className="nav-label">Go Back</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header */}
          <div className="welcome-section">
            <h2>{selectedPathway ? selectedPathway.title : 'Career Pathway Result'}</h2>
            <p>Your AI-generated pathway, subjects and next steps.</p>
          </div>

          {/* Selected Pathway */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>🎯 Selected Pathway</h3>
            </div>
            {!selectedPathway ? (
              <div className="error-text">No pathway found.</div>
            ) : (
              <div className="resources-grid">
                <div className="resource-card" style={{ textAlign: 'left' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>{selectedPathway.title}</h4>
                  <div className="career-details" style={{ marginBottom: '0.75rem' }}>
                    <div className="career-detail-item">
                      <span className="detail-label">Salary Range</span>
                      <span className="detail-value">{selectedPathway.salary_range?.[0] || '—'}</span>
                    </div>
                    <div className="career-detail-item">
                      <span className="detail-label">Job Growth</span>
                      <span className="detail-value growth">{selectedPathway['job growth'] || '—'}</span>
                    </div>
                  </div>

                  {/* Example Roles */}
                  {Array.isArray(selectedPathway.example_roles) && selectedPathway.example_roles.length > 0 && (
                    <div className="detail-section" style={{ marginTop: '0.75rem' }}>
                      <h4>🎯 Example Roles</h4>
                      <div className="career-tags">
                        {selectedPathway.example_roles.map((role, idx) => (
                          <span key={idx} className="career-tag">{role}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entry Routes */}
                  {Array.isArray(selectedPathway.entry_routes) && selectedPathway.entry_routes.length > 0 && (
                    <div className="detail-section" style={{ marginTop: '0.75rem' }}>
                      <h4>🎓 Entry Routes</h4>
                      <div className="details-grid">
                        {selectedPathway.entry_routes.map((route, idx) => (
                          <div key={idx} className="detail-item">
                            <span className="detail-icon">🧭</span>
                            <div>
                              <span className="detail-label">{route.route}</span>
                              {route.example_degrees && (
                                <span className="detail-value">Degrees: {route.example_degrees.join(', ')}</span>
                              )}
                              {route.example_certificates && (
                                <span className="detail-value">Certificates: {route.example_certificates.join(', ')}</span>
                              )}
                              {route.prerequisites_or_assumed && (
                                <span className="detail-value">Prerequisites: {route.prerequisites_or_assumed.join(', ')}</span>
                              )}
                              {route.notes && (
                                <span className="detail-value">Notes: {route.notes}</span>
                              )}
                              {route.pathway_to_uni && (
                                <span className="detail-value">Pathway to Uni: {route.pathway_to_uni}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills to Build */}
                  {Array.isArray(selectedPathway.skills_to_build) && selectedPathway.skills_to_build.length > 0 && (
                    <div className="detail-section" style={{ marginTop: '0.75rem' }}>
                      <h4>🛠️ Skills to Build</h4>
                      <div className="career-tags">
                        {selectedPathway.skills_to_build.map((skill, idx) => (
                          <span key={idx} className="career-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Experiences */}
                  {Array.isArray(selectedPathway.suggested_experiences) && selectedPathway.suggested_experiences.length > 0 && (
                    <div className="detail-section" style={{ marginTop: '0.75rem' }}>
                      <h4>🌟 Suggested Experiences</h4>
                      <ul className="recommended-list">
                        {selectedPathway.suggested_experiences.map((exp, idx) => (
                          <li key={idx}><span className="check-icon">✓</span>{exp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Subjects */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>📚 Recommended HSC Subjects</h3>
            </div>
            <div className="resources-grid">
              {subjects.map((s, i) => (
                <div key={i} className="resource-card" style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: 0 }}>{s.subject}</h4>
                  <p style={{ marginTop: '0.5rem' }}>{s.why}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Action Plan */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>📋 Action Plan</h3>
            </div>
            <div className="resources-grid">
              <div className="resource-card" style={{ textAlign: 'left' }}>
                <h4 style={{ marginTop: 0 }}>Near term (1–3 months)</h4>
                <ul>
                  {(action.near_term_1_3_months || []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
              <div className="resource-card" style={{ textAlign: 'left' }}>
                <h4 style={{ marginTop: 0 }}>Mid term (this year)</h4>
                <ul>
                  {(action.mid_term_this_year || []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
              <div className="resource-card" style={{ textAlign: 'left' }}>
                <h4 style={{ marginTop: 0 }}>Long term (post school)</h4>
                <ul>
                  {(action.long_term_post_school || []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {/* Resources */}
          <section className="dashboard-section">
            <div className="section-header">
              <h3>🔗 Resources</h3>
            </div>
            <div className="resources-grid">
              {resources.map((r, i) => (
                <div key={i} className="resource-card" style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: 0 }}>{r.name}</h4>
                  <p style={{ marginTop: '0.5rem' }}>{r.purpose}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default CareerResultPage


