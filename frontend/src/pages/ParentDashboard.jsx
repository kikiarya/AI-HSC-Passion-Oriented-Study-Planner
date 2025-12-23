import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'
import parentApi from '../services/parentApi'
import ChildWeeklyReportView from '../components/parent/ChildWeeklyReportView'
import './StudentDashboard.css'

function ParentDashboard() {
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [parentProfile, setParentProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [activeView, setActiveView] = useState('dashboard')

  useEffect(() => {
    const fetchParentProfile = async () => {
      try {
        const response = await authService.getProfile()
        //console.log(response)
        setParentProfile(response.data)
      } catch (error) {
        console.error('Failed to fetch parent profile:', error)
        if (error.response?.status === 401) {
          navigate('/login/parent')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchParentProfile()
    fetchChildren()
  }, [navigate])

  const fetchChildren = async () => {
    try {
      const response = await parentApi.getChildren()
      if (response.success && response.children) {
        setChildren(response.children)
        // Auto-select first child if available
        if (response.children.length > 0 && !selectedChild) {
          setSelectedChild(response.children[0].student_id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch children:', error)
      setChildren([])
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
    navigate('/login/parent')
  }

  const displayName = parentProfile
    ? `${parentProfile.first_name || ''} ${parentProfile.last_name || ''}`.trim()
    : 'Parent'

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-dashboard" onClick={() => navigate('/')}>
            <span className="logo-icon">⚡</span>
            <span className="logo-text">HSC Power</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <span className="nav-icon">👨‍👩‍👧‍👦</span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'weekly-report' ? 'active' : ''}`}
            onClick={() => setActiveView('weekly-report')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Weekly Reports</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">Parent Portal</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <h1 className="page-title">Parent Dashboard</h1>
          <div className="header-right">
            <button className="header-btn">
              <span className="notification-icon">🔔</span>
            </button>

            <div className="user-menu-container">
              <button
                className="user-profile-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="user-avatar">👨‍👩‍👧‍👦</span>
                <span className="user-name">{displayName}</span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-info-name">{displayName}</p>
                    <p className="user-info-email">{parentProfile?.email || ''}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="dashboard-content">
          {activeView === 'dashboard' && (
            <div className="welcome-section">
              <h2>Welcome, {displayName}!</h2>
              <p>Manage and view your children's progress and reports.</p>
              
              {/* Children List */}
              {children.length > 0 ? (
                <div className="children-list" style={{ marginTop: '2rem' }}>
                  <h3>Your Children ({children.length})</h3>
                  <div className="children-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                    gap: '1rem', 
                    marginTop: '1rem' 
                  }}>
                    {children.map(child => (
                      <div 
                        key={child.student_id} 
                        className="child-card"
                        style={{
                          background: 'white',
                          borderRadius: '0.75rem',
                          padding: '1.5rem',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                          border: selectedChild === child.student_id ? '2px solid #667eea' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onClick={() => setSelectedChild(child.student_id)}
                      >
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1a202c' }}>
                          {child.full_name || 'Your Child'}
                        </h4>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#718096', fontSize: '0.875rem' }}>
                          {child.relationship}
                        </p>
                        <p style={{ margin: 0, color: '#a0aec0', fontSize: '0.8rem' }}>
                          {child.email}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="no-children" style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  background: 'white', 
                  borderRadius: '0.75rem',
                  marginTop: '2rem'
                }}>
                  <p>No children linked to your account yet.</p>
                </div>
              )}
            </div>
          )}
          
          {activeView === 'weekly-report' && selectedChild && (
            <ChildWeeklyReportView studentId={selectedChild} />
          )}
          
          {activeView === 'weekly-report' && !selectedChild && children.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>No children linked to your account</h3>
              <p>Please contact your child's school to link your account.</p>
            </div>
          )}
          
          {activeView === 'weekly-report' && !selectedChild && children.length > 0 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>Select a child to view weekly report</h3>
              <p>Please go back to Dashboard and select a child first.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ParentDashboard

