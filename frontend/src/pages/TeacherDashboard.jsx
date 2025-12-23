import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import authService from '../services/authService'
import teacherApi from '../services/teacherApi'
import DashboardOverview from '../components/teacher/DashboardOverview'
import MyClassesView from '../components/teacher/MyClassesView'
import ClassDetailView from '../components/teacher/ClassDetailView'
import AssignmentsView from '../components/teacher/AssignmentsView'
import AssignmentDetailView from '../components/teacher/AssignmentDetailView'
import CreateAssignmentView from '../components/teacher/CreateAssignmentView'
import GradeAssignmentView from '../components/teacher/GradeAssignmentView'
import StudentsView from '../components/teacher/StudentsView'
import StudentGradesView from '../components/teacher/StudentGradesView'
import AnalyticsView from '../components/teacher/AnalyticsView'
import AnnouncementsView from '../components/teacher/AnnouncementsView'
import SettingsView from '../components/teacher/SettingsView'
import './TeacherDashboard.css'

function TeacherDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract tab from URL path
  const pathParts = location.pathname.split('/')
  const urlTab = pathParts[pathParts.length - 1] // Get last part of path
  const validTabs = ['dashboard', 'classes', 'assignments', 'students', 'analytics', 'announcements', 'settings']
  const initialTab = validTabs.includes(urlTab) ? urlTab : 'dashboard'
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)
  const [isGradingAssignment, setIsGradingAssignment] = useState(false)
  const [teacherProfile, setTeacherProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        const response = await authService.getProfile()
        setTeacherProfile(response.data)
      } catch (error) {
        console.error('Failed to fetch teacher profile:', error)
        if (error.response?.status === 401) {
          navigate('/login/teacher')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherProfile()
  }, [navigate])

  // Sync activeTab with URL changes and detect student grades route
  useEffect(() => {
    // Check if URL matches student grades pattern: /teacher/students/:studentId/grades
    const gradesMatch = location.pathname.match(/^\/teacher\/students\/([^/]+)\/grades$/)
    if (gradesMatch) {
      const studentId = gradesMatch[1]
      setSelectedStudentId(studentId)
      setActiveTab('students')
    } else {
      // Clear selectedStudentId if not on grades route
      setSelectedStudentId(null)
      // Update activeTab if URL tab changed
      const pathParts = location.pathname.split('/')
      const currentUrlTab = pathParts[pathParts.length - 1]
      const validTabs = ['dashboard', 'classes', 'assignments', 'students', 'analytics', 'announcements', 'settings']
      if (validTabs.includes(currentUrlTab) && currentUrlTab !== activeTab) {
        setActiveTab(currentUrlTab)
      }
    }
  }, [location.pathname, activeTab])

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
    navigate('/login/teacher')
  }

  const handleClassClick = (classId) => {
    setSelectedClassId(classId)
  }

  const handleBackToClasses = () => {
    setSelectedClassId(null)
  }

  const handleAssignmentClick = (assignmentId) => {
    setSelectedAssignmentId(assignmentId)
    setSelectedClassId(null)
    setIsCreatingAssignment(false)
    setIsGradingAssignment(false)
    // Route to assignments tab while preserving the selected assignment
    navigate('/teacher/assignments', { replace: true })
    setActiveTab('assignments')
  }

  const handleCreateAssignment = (assignmentId = null) => {
    if (assignmentId) {
      setSelectedAssignmentId(assignmentId)
    }
    setIsCreatingAssignment(true)
  }

  const handleBackToAssignments = () => {
    setSelectedAssignmentId(null)
    setIsCreatingAssignment(false)
    setIsGradingAssignment(false)
  }

  const handleGradeAssignment = (assignmentId) => {
    setSelectedAssignmentId(assignmentId)
    setIsGradingAssignment(true)
  }

  const handleEditAssignment = (assignmentId) => {
    setSelectedAssignmentId(assignmentId)
    setIsCreatingAssignment(true)
  }

  const handleDeleteAssignment = (assignmentId) => {
    // If the deleted assignment was being viewed, go back
    if (selectedAssignmentId === assignmentId) {
      handleBackToAssignments()
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSelectedClassId(null)
    setSelectedAssignmentId(null)
    setSelectedStudentId(null)
    setIsCreatingAssignment(false)
    setIsGradingAssignment(false)
    // Update URL to match the active tab
    if (tab === 'dashboard') {
      navigate('/teacher/dashboard', { replace: true })
    } else {
      navigate(`/teacher/${tab}`, { replace: true })
    }
  }

  const handleBackToStudents = () => {
    setSelectedStudentId(null)
    navigate('/teacher/students', { replace: true })
  }


  const renderContent = () => {
    // Priority: Show detail views if selected
    // Student grades view
    if (selectedStudentId) {
      return (
        <StudentGradesView studentId={selectedStudentId} onBack={handleBackToStudents} />
      )
    }

    if (selectedClassId) {
      return (
        <ClassDetailView
          classId={selectedClassId}
          onBack={handleBackToClasses}
          onCreateAssignment={handleCreateAssignment}
          onAssignmentClick={handleAssignmentClick}
          onEditAssignment={handleCreateAssignment}
          onGradeAssignment={handleGradeAssignment}
        />
      )
    }

    // Assignment detail view
    if (selectedAssignmentId && !isCreatingAssignment && !isGradingAssignment) {
      return (
        <AssignmentDetailView
          assignmentId={selectedAssignmentId}
          onBack={handleBackToAssignments}
          onEdit={handleEditAssignment}
        />
      )
    }

    if (isCreatingAssignment) {
      return (
        <CreateAssignmentView
          assignmentId={selectedAssignmentId}
          classId={selectedClassId}
          onBack={handleBackToAssignments}
        />
      )
    }

    if (isGradingAssignment && selectedAssignmentId) {
      return (
        <GradeAssignmentView
          assignmentId={selectedAssignmentId}
          onBack={handleBackToAssignments}
        />
      )
    }

    // Main tab views
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            onTabChange={handleTabChange}
            onClassClick={handleClassClick}
            onCreateAssignment={handleCreateAssignment}
          />
        )
      case 'classes':
        return (
          <MyClassesView
            onClassClick={handleClassClick}
          />
        )
      case 'assignments':
        return (
          <AssignmentsView
            onAssignmentClick={handleAssignmentClick}
            onCreateAssignment={handleCreateAssignment}
            onGradeAssignment={handleGradeAssignment}
            onEditAssignment={handleEditAssignment}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )
      case 'students':
        return <StudentsView />
      case 'analytics':
        return <AnalyticsView />
      case 'announcements':
        return <AnnouncementsView />
      case 'settings':
        return <SettingsView teacherProfile={teacherProfile} />
      default:
        return <DashboardOverview onTabChange={handleTabChange} />
    }
  }

  const getPageTitle = () => {
    if (selectedStudentId) return 'Student Grades'
    if (selectedClassId) return 'Class Details'
    if (selectedAssignmentId && !isCreatingAssignment && !isGradingAssignment) return 'Assignment Details'
    if (isCreatingAssignment) return selectedAssignmentId ? 'Edit Assignment' : 'Create Assignment'
    if (isGradingAssignment) return 'Grade Assignment'
    
    const titles = {
      dashboard: 'Dashboard',
      classes: 'My Classes',
      assignments: 'Assignments',
      students: 'Students',
      analytics: 'Analytics',
      announcements: 'Announcements',
      settings: 'Settings'
    }
    return titles[activeTab] || 'Dashboard'
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-main" style={{ marginLeft: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <p>Loading teacher data...</p>
          </div>
        </div>
      </div>
    )
  }

  const displayName = teacherProfile 
    ? `${teacherProfile.first_name || ''} ${teacherProfile.last_name || ''}`.trim() || teacherProfile.email
    : 'Teacher'

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
            className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => handleTabChange('classes')}
          >
            <span className="nav-icon">📚</span>
            <span className="nav-label">My Classes</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => handleTabChange('assignments')}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">Assignments</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => handleTabChange('students')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Students</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-label">Analytics</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => handleTabChange('announcements')}
          >
            <span className="nav-icon">📢</span>
            <span className="nav-label">Announcements</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">Teacher Portal v1.0</p>
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
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen)
                }}
              >
                <span className="user-avatar">👨‍🏫</span>
                <span className="user-name">{displayName}</span>
              </button>

              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-info-name">{displayName}</p>
                    <p className="user-info-email">{teacherProfile?.email || ''}</p>
                    <p className="user-info-id">ID: {teacherProfile?.id || ''}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      handleTabChange('settings')
                      setUserMenuOpen(false)
                    }}
                  >
                    ⚙️ Settings
                  </button>
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

export default TeacherDashboard

