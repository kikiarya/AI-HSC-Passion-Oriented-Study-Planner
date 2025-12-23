import { useState, useEffect } from 'react'
import teacherApi from '../../services/teacherApi'
import authService from '../../services/authService'
import './DashboardOverview.css'

function DashboardOverview({ onTabChange, onClassClick, onCreateAssignment }) {
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [teacherProfile, setTeacherProfile] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, assignmentsRes, studentsRes, profileRes, announcementsRes] = await Promise.all([
          teacherApi.getClasses(),
          teacherApi.getAssignments(),
          teacherApi.getStudents(),
          authService.getProfile(),
          teacherApi.getAnnouncements()
        ])
        setClasses(classesRes.classes || [])
        setAssignments(assignmentsRes.assignments || [])
        setStudents(studentsRes.students || [])
        setTeacherProfile(profileRes.data)
        setAnnouncements(announcementsRes.announcements || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  const totalStudents = students.length
  const pendingGrading = assignments.filter(a => a.status === 'grading' || a.status === 'published').length
  const todayClasses = classes // For now, show all classes as "today's classes"
  const overallPerformance = 85 // TODO: Calculate from actual data

  const displayName = teacherProfile 
    ? `${teacherProfile.first_name || ''} ${teacherProfile.last_name || ''}`.trim() || teacherProfile.email
    : 'Teacher'

  // Generate recent activity from assignments (mock for now)
  const recentActivity = assignments.slice(0, 5).map((assignment, idx) => ({
    id: idx,
    icon: '📝',
    action: 'created assignment',
    item: assignment.title,
    class: assignment.class_id,
    timestamp: new Date(assignment.created_at).toLocaleDateString()
  }))

  return (
    <>
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome back, {displayName}! 👋</h2>
        <p>Here's what's happening with your classes today.</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea20', color: '#667eea' }}>👥</div>
          <div className="stat-info">
            <p className="stat-value">{totalStudents}</p>
            <p className="stat-label">Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5656520', color: '#f56565' }}>📝</div>
          <div className="stat-info">
            <p className="stat-value">{pendingGrading}</p>
            <p className="stat-label">Pending Grading</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#48bb7820', color: '#48bb78' }}>📚</div>
          <div className="stat-info">
            <p className="stat-value">{todayClasses.length}</p>
            <p className="stat-label">Classes Today</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ed893620', color: '#ed8936' }}>📊</div>
          <div className="stat-info">
            <p className="stat-value">{overallPerformance}%</p>
            <p className="stat-label">Avg Performance</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Today's Classes */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>Today's Classes</h3>
            <button className="btn-link" onClick={() => onTabChange('classes')}>View All</button>
          </div>
          {todayClasses.length > 0 ? (
            <div className="classes-list">
              {todayClasses.map(classItem => {
                const classAnnouncementCount = announcements.filter(a => a.classId === classItem.id).length
                return (
                <div
                  key={classItem.id}
                  className="class-card"
                  style={{ borderLeft: `4px solid ${classItem.color || '#667eea'}` }}
                  onClick={() => onClassClick(classItem.id)}
                >
                  <div className="class-header">
                    <div>
                      <h4>{classItem.name}</h4>
                      <p className="class-code">{classItem.code}</p>
                    </div>
                    <span className="class-badge" style={{ background: `${classItem.color || '#667eea'}20`, color: classItem.color || '#667eea' }}>
                      Class
                    </span>
                  </div>
                  <div className="class-description">
                    <p>{classItem.description || 'No description'}</p>
                  </div>
                    {classAnnouncementCount > 0 && (
                      <div className="class-footer" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.875rem', color: '#718096' }}>
                          📢 {classAnnouncementCount} announcement{classAnnouncementCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No classes scheduled for today</p>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>Recent Activity</h3>
          </div>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">{activity.icon}</div>
                  <div className="activity-info">
                    <p className="activity-text">
                      You {activity.action} <em>{activity.item}</em>
                    </p>
                    <p className="activity-meta">
                      {activity.class} • {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="action-card" onClick={onCreateAssignment}>
            <span className="action-icon">➕</span>
            <div>
              <h4>Create Assignment</h4>
              <p>Create a new assignment or quiz</p>
            </div>
          </button>
          <button className="action-card" onClick={() => onTabChange('announcements')}>
            <span className="action-icon">📢</span>
            <div>
              <h4>Post Announcement</h4>
              <p>Announce to one or all classes</p>
            </div>
          </button>
          <button className="action-card" onClick={() => onTabChange('assignments')}>
            <span className="action-icon">✅</span>
            <div>
              <h4>Grade Submissions</h4>
              <p>{pendingGrading} pending submissions</p>
            </div>
          </button>
          <button className="action-card" onClick={() => onTabChange('analytics')}>
            <span className="action-icon">📊</span>
            <div>
              <h4>View Analytics</h4>
              <p>Class performance insights</p>
            </div>
          </button>
        </div>
      </section>

      {/* My Classes Overview */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3>My Classes</h3>
          <button className="btn-link" onClick={() => onTabChange('classes')}>View All</button>
        </div>
        <div className="classes-grid-compact">
          {classes.map(classItem => {
            const classAnnouncementCount = announcements.filter(a => a.classId === classItem.id).length
            return (
            <div
              key={classItem.id}
              className="class-card-compact"
              style={{ borderTop: `4px solid ${classItem.color || '#667eea'}` }}
              onClick={() => onClassClick(classItem.id)}
            >
              <h4>{classItem.name}</h4>
              <p className="class-code">{classItem.code}</p>
              <div className="class-stats-compact">
                <span>📚 {classItem.description || 'No description'}</span>
                  {classAnnouncementCount > 0 && (
                    <span style={{ marginTop: '0.25rem', display: 'block', color: '#718096', fontSize: '0.875rem' }}>
                      📢 {classAnnouncementCount} announcement{classAnnouncementCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {classes.length === 0 && (
          <div className="empty-state">
            <p>You haven't created any classes yet</p>
          </div>
        )}
      </section>
    </>
  )
}

export default DashboardOverview
