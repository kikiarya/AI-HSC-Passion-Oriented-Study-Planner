import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DashboardOverview from '../components/dashboard/DashboardOverview'
import authService from '../services/authService'
import studentApi from '../services/studentApi'
import ClassesView from '../components/dashboard/ClassesView'
import GradesView from '../components/dashboard/GradesView'
import AssignmentsView from '../components/dashboard/AssignmentsView'
import StudyPlannerView from '../components/dashboard/StudyPlannerView'
import CareerView from '../components/dashboard/CareerView'
import SettingsView from '../components/dashboard/SettingsView'
import HSCSubjectsView from '../components/dashboard/HSCSubjectsView'
import WeeklyReportView from '../components/dashboard/WeeklyReportView'
import ClassDetailPage from '../components/dashboard/ClassDetailPage'
import AssignmentDetailPage from '../components/dashboard/AssignmentDetailPage'
import HSCSubjectRecommendation from '../components/dashboard/HSCSubjectRecommendation'
import ChatView from '../components/dashboard/ChatView'
import KnowledgeGaps from '../components/dashboard/KnowledgeGaps'
import './StudentDashboard.css'

function StudentDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Extract tab from URL path
  const pathParts = location.pathname.split('/')
  const urlTab = pathParts[pathParts.length - 1] // Get last part of path
  const validTabs = ['dashboard', 'classes', 'grades', 'assignments', 'study-planner', 'career', 'hsc-subjects', 'hsc-subjects-recommendation', 'weekly-report', 'chat', 'knowledge-gaps', 'settings']
  const initialTab = validTabs.includes(urlTab) ? urlTab : 'dashboard'
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [showNotificationPopup, setShowNotificationPopup] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const notificationPopupRef = useRef(null)
  
  // State for data from API
  const [studentData, setStudentData] = useState({})
  const [enrolledClasses, setEnrolledClasses] = useState([])
  const [upcomingAssignments, setUpcomingAssignments] = useState([])
  const [recentGrades, setRecentGrades] = useState([])
  const [studyPlanSuggestions, setStudyPlanSuggestions] = useState([])
  const [careerRecommendations, setCareerRecommendations] = useState([])
  
  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  
  // Get initial user data from localStorage
  const getInitialUserData = () => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      return currentUser
    }
    return null
  }
  
  const [initialUserData] = useState(() => getInitialUserData())

  const handleLogout = async () => {
    await authService.logout()
    navigate('/login/student')
  }

  useEffect(() => {
    // Set initial user data from localStorage immediately
    // if (initialUserData) {
    //   setUserProfile(initialUserData)
    // }
    
    const fetchUserProfile = async () => {
      try {
        const response = await authService.getProfile()
        // console.log(response)
        setUserProfile(response.data)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        // Keep the initial data if API fails
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Function to fetch student classes - memoized with useCallback
  const fetchStudentClasses = useCallback(async () => {
    setLoadingClasses(true)
    try {
      // Invoke backend API /api/student/classes
      // JWT token is automatically passed via authenticatedRequest in studentApi
      const response = await studentApi.getClasses()
      setEnrolledClasses(response.classes || [])
    } catch (error) {
      console.error('Failed to fetch student classes:', error)
      // Keep empty array on error
      setEnrolledClasses([])
    } finally {
      setLoadingClasses(false)
    }
  }, [])

  // Function to fetch student assignments - memoized with useCallback
  const fetchStudentAssignments = useCallback(async () => {
    try {
      // Invoke backend API /api/student/assignments
      // JWT token is automatically passed via authenticatedRequest in studentApi
      const response = await studentApi.getAssignments({ upcoming: 'true' })
      setUpcomingAssignments(response.assignments || [])
    } catch (error) {
      console.error('Failed to fetch student assignments:', error)
      // Keep empty array on error
      setUpcomingAssignments([])
    }
  }, [])

  // Function to fetch student grades - memoized with useCallback
  const fetchStudentGrades = useCallback(async () => {
    try {
      // Invoke backend API /api/student/grades
      // JWT token is automatically passed via authenticatedRequest in studentApi
      const response = await studentApi.getGrades()
      setRecentGrades(response.grades || [])
    } catch (error) {
      console.error('Failed to fetch student grades:', error)
      // Keep empty array on error
      setRecentGrades([])
    }
  }, [])

  // Fetch assignments when assignments tab is clicked/activated
  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchStudentAssignments()
    }
  }, [activeTab, fetchStudentAssignments])
 
  // Prefetch classes and assignments on first load so Dashboard has data
  useEffect(() => {
    fetchStudentClasses()
    fetchStudentAssignments()
  }, [fetchStudentClasses, fetchStudentAssignments])
  
  // Sync activeTab with URL changes
  useEffect(() => {
    if (urlTab !== activeTab && validTabs.includes(urlTab)) {
      setActiveTab(urlTab)
    }
  }, [location.pathname])

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true)
    try {
      const response = await studentApi.getAnnouncements()
      setNotifications(response.announcements || [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      // Keep existing notifications on error
    } finally {
      setLoadingNotifications(false)
    }
  }

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications()
    fetchStudentAssignments()
    fetchStudentClasses()
    fetchStudentGrades()
  }, [])

  // Fetch notifications when popup opens
  useEffect(() => {
    if (showNotificationPopup) {
      fetchNotifications()
    }
  }, [showNotificationPopup])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationPopupRef.current &&
        !notificationPopupRef.current.contains(event.target) &&
        showNotificationPopup
      ) {
        setShowNotificationPopup(false)
      }
    }

    if (showNotificationPopup) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showNotificationPopup])

  // Helper function to format time ago
  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const handleClassClick = (classId) => {
    setSelectedClassId(classId)
    setSelectedAssignmentId(null)
  }

  const handleAssignmentClick = (assignmentId) => {
    setSelectedAssignmentId(assignmentId)
    setSelectedClassId(null)
  }

  const handleBackToClasses = () => {
    setSelectedClassId(null)
  }

  const handleBackToAssignments = () => {
    setSelectedAssignmentId(null)
    setActiveTab('assignments')
    navigate('/student/assignments', { replace: true })
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // Clear selected class/assignment when changing tabs
    setSelectedClassId(null)
    setSelectedAssignmentId(null)
    // Update URL to match the active tab
    if (tab === 'dashboard') {
      navigate('/student/dashboard', { replace: true })
    } else {
      navigate(`/student/${tab}`, { replace: true })
    }
  }

  const renderContent = () => {
    // Show Class Detail Page if a class is selected
    if (selectedClassId) {
      const classData = enrolledClasses.find(c => c.id === selectedClassId)
      return <ClassDetailPage classData={classData} onBack={handleBackToClasses} onAssignmentClick={handleAssignmentClick} />
    }

    // Show Assignment Detail Page if an assignment is selected
    if (selectedAssignmentId) {
      return <AssignmentDetailPage assignmentId={selectedAssignmentId} onBack={handleBackToAssignments} />
    }

    // Otherwise show the normal tab content
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            studentData={studentData}
            userProfile={userProfile}
            enrolledClasses={enrolledClasses}
            upcomingAssignments={upcomingAssignments}
            recentGrades={recentGrades}
            onTabChange={handleTabChange}
            loading={loading || loadingClasses || loadingAssignments}
          />
        )
      case 'classes':
        return <ClassesView enrolledClasses={enrolledClasses} onClassClick={handleClassClick} loading={loadingClasses} />
      case 'grades':
        return <GradesView enrolledClasses={enrolledClasses} recentGrades={recentGrades} />
      case 'assignments':
        return <AssignmentsView upcomingAssignments={upcomingAssignments} onAssignmentClick={handleAssignmentClick} />
      case 'study-planner':
        return <StudyPlannerView studyPlanSuggestions={studyPlanSuggestions} />
      case 'career':
        return <CareerView careerRecommendations={careerRecommendations} />
      case 'hsc-subjects-recommendation':
        return <HSCSubjectRecommendation />
      case 'hsc-subjects':
        return <HSCSubjectsView />
      case 'weekly-report':
        return <WeeklyReportView />
      case 'chat':
        return <ChatView />
      case 'knowledge-gaps':
        return <KnowledgeGaps />
      case 'settings':
        return <SettingsView studentData={studentData} userProfile={userProfile} onProfileUpdate={setUserProfile} />
      default:
        return null
    }
  }

  const getPageTitle = () => {
    if (selectedClassId) {
      const classData = enrolledClasses.find(c => c.id === selectedClassId)
      return classData ? classData.name : 'Class Details'
    }
    if (selectedAssignmentId) {
      const assignmentData = upcomingAssignments.find(a => a.id === selectedAssignmentId)
      return assignmentData ? assignmentData.title : 'Assignment Details'
    }
    const titles = {
      dashboard: 'Dashboard',
      classes: 'My Classes',
      grades: 'Grades',
      assignments: 'Assignments',
      'study-planner': 'AI Study Planner',
      career: 'Career Recommendations',
      'hsc-subjects-recommendation': 'HSC Subject Recommendation',
      'hsc-subjects': 'Browse HSC Subjects',
      'weekly-report': 'Weekly Report',
      chat: 'AI Chat',
      'knowledge-gaps': 'Knowledge Gaps',
      settings: 'Settings'
    }
    return titles[activeTab] || 'Dashboard'
  }

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
            className={`nav-item ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => handleTabChange('grades')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-label">Grades</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => handleTabChange('assignments')}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">Assignments</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'study-planner' ? 'active' : ''}`}
            onClick={() => handleTabChange('study-planner')}
          >
            <span className="nav-icon">🤖</span>
            <span className="nav-label">AI Study Planner</span>
          </button>
          {/* New HSC Subject Recommendation button */}
          <button 
            className={`nav-item ${activeTab === 'hsc-subjects-recommendation' ? 'active' : ''}`}
            onClick={() => handleTabChange('hsc-subjects-recommendation')}
          >
            <span className="nav-icon">🧠</span>
            <span className="nav-label">HSC Subject Recommendation</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'career' ? 'active' : ''}`}
            onClick={() => handleTabChange('career')}
          >
            <span className="nav-icon">🎯</span>
            <span className="nav-label">Career Path</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'hsc-subjects' ? 'active' : ''}`}
            onClick={() => handleTabChange('hsc-subjects')}
          >
            <span className="nav-icon">📖</span>
            <span className="nav-label">HSC Subjects</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'weekly-report' ? 'active' : ''}`}
            onClick={() => handleTabChange('weekly-report')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Weekly Report</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => handleTabChange('chat')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">AI Chat</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'knowledge-gaps' ? 'active' : ''}`}
            onClick={() => handleTabChange('knowledge-gaps')}
          >
            <span className="nav-icon">🔍</span>
            <span className="nav-label">Knowledge Gaps</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => handleTabChange('settings')}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>
          <div className="header-right">
            <div className="notification-container" ref={notificationPopupRef}>
              <button 
                className="header-btn"
                onClick={() => {
                  setShowNotificationPopup(!showNotificationPopup)
                  setShowUserMenu(false) // Close user menu when opening notifications
                }}
              >
                <span className="notification-icon">🔔</span>
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
              {showNotificationPopup && (
                <div className="notification-popup">
                  <div className="notification-popup-header">
                    <h3>Notifications</h3>
                    {loadingNotifications && <span className="notification-loading">Loading...</span>}
                  </div>
                  <div className="notification-popup-content">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <p>No notifications</p>
                        <span>You're all caught up!</span>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="notification-item">
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-content">
                            {notification.content.length > 100
                              ? `${notification.content.substring(0, 100)}...`
                              : notification.content}
                          </div>
                          <div className="notification-meta">
                            <span className="notification-class">{notification.className}</span>
                            <span className="notification-time">{getTimeAgo(notification.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="user-menu-container">
              <button 
                className="user-profile-btn"
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowNotificationPopup(false) // Close notifications when opening user menu
                }}
              >
                <span className="user-avatar">{userProfile?.avatar || '👤'}</span>
                <span className="user-name">
                  {userProfile?.first_name && userProfile?.last_name 
                    ? `${userProfile.first_name} ${userProfile.last_name}` 
                    : userProfile?.name || (loading ? 'Loading...' : '')}
                </span>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-info-name">
                      {userProfile?.first_name && userProfile?.last_name 
                        ? `${userProfile.first_name} ${userProfile.last_name}` 
                        : userProfile?.name || ''}
                    </p>
                    <p className="user-info-email">{userProfile?.email || ''}</p>
                    <p className="user-info-id">ID: {userProfile?.id ? userProfile.id.slice(0, 8) : 'N/A'}</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={() => handleTabChange('settings')}>
                    Settings
                  </button>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard
