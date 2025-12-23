import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authService from '../services/authService'
import DashboardOverview from '../components/admin/DashboardOverview'
import StudentsView from '../components/admin/StudentsView'
import TeachersView from '../components/admin/TeachersView'
import './AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract tab from URL path
  const pathParts = location.pathname.split('/')
  const urlTab = pathParts[pathParts.length - 1] // Get last part of path
  const validTabs = ['dashboard', 'students', 'teachers']
  const initialTab = validTabs.includes(urlTab) ? urlTab : 'dashboard'
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [adminProfile, setAdminProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await authService.getProfile()
        setAdminProfile(response.data)
      } catch (error) {
        console.error('Failed to fetch admin profile:', error)
        if (error.message?.includes('401') || error.message?.includes('Not authenticated')) {
          navigate('/login/admin')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAdminProfile()
  }, [navigate])
  
  // Sync activeTab with URL changes
  useEffect(() => {
    if (urlTab !== activeTab && validTabs.includes(urlTab)) {
      setActiveTab(urlTab)
    }
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
    navigate('/login/admin')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Update URL to match the active tab
    if (tab === 'dashboard') {
      navigate('/admin/dashboard', { replace: true })
    } else {
      navigate(`/admin/${tab}`, { replace: true })
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />
      case 'students':
        return <StudentsView />
      case 'teachers':
        return <TeachersView />
      default:
        return <DashboardOverview />
    }
  }

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      students: 'Student Accounts',
      teachers: 'Teacher Accounts'
    }
    return titles[activeTab] || 'Dashboard'
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-main" style={{ marginLeft: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading admin data...</p>
          </div>
        </div>
      </div>
    )
  }

  const displayName = adminProfile 
    ? `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim() || adminProfile.email || adminProfile.name
    : 'Admin'

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
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => handleTabChange('students')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Students</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => handleTabChange('teachers')}
          >
            <span className="nav-icon">👨‍🏫</span>
            <span className="nav-label">Teachers</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">Admin Portal v1.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <h1 className="page-title">{getPageTitle()}</h1>
          <div className="header-right">
            <div className="user-menu-container">
              <button
                className="user-profile-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <span className="user-avatar">🔐</span>
                <span className="user-name">{displayName}</span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-info-name">{displayName}</p>
                    <p className="user-info-email">{adminProfile?.email || ''}</p>
                    <p className="user-info-role">Admin</p>
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
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard

