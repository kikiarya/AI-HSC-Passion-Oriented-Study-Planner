import { getDaysUntilDue } from '../../utils/helpers'

function DashboardOverview({ studentData, userProfile, enrolledClasses, upcomingAssignments, recentGrades, onTabChange, loading }) {
  const displayName = userProfile?.first_name && userProfile?.last_name 
    ? `${userProfile.first_name} ${userProfile.last_name}` 
    : userProfile?.name || ''

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <>
      <div className="welcome-section">
        <h2>Welcome back, {displayName}! 👋</h2>
        <p>Here's what's happening with your studies today.</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#667eea20', color: '#667eea' }}>📚</div>
          <div className="stat-info">
            <p className="stat-value">{enrolledClasses.length}</p>
            <p className="stat-label">Enrolled Classes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5656520', color: '#f56565' }}>📝</div>
          <div className="stat-info">
            <p className="stat-value">{upcomingAssignments.length}</p>
            <p className="stat-label">Pending Assignments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#48bb7820', color: '#48bb78' }}>📈</div>
          <div className="stat-info">
            <p className="stat-value">A-</p>
            <p className="stat-label">Overall Average</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ed893620', color: '#ed8936' }}>🎯</div>
          <div className="stat-info">
            <p className="stat-value">89%</p>
            <p className="stat-label">Completion Rate</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Enrolled Classes */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>My Classes</h3>
            <button className="btn-link" onClick={() => onTabChange('classes')}>View All</button>
          </div>
          <div className="classes-list">
            {enrolledClasses.slice(0, 2).map(course => (
              <div key={course.id} className="class-card" style={{ borderLeft: `4px solid ${course.color}` }}>
                <div className="class-header">
                  <div>
                    <h4>{course.name}</h4>
                    <p className="class-code">{course.code} • {course.teacher}</p>
                  </div>
                  <span className="class-grade" style={{ background: `${course.color}20`, color: course.color }}>
                    {course.grade}
                  </span>
                </div>
                <div className="class-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${course.progress}%`, background: course.color }}
                    ></div>
                  </div>
                  <span className="progress-text">{course.progress}% Complete</span>
                </div>
                <div className="class-footer">
                  <span className="class-next">Next: {course.nextClass}</span>
                  {course.assignments > 0 && (
                    <span className="class-assignments">{course.assignments} pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Upcoming Assignments */}
        <section className="dashboard-section">
          <div className="section-header">
            <h3>Upcoming Assignments</h3>
            <button className="btn-link" onClick={() => onTabChange('assignments')}>View All</button>
          </div>
          <div className="assignments-list">
            {upcomingAssignments.map(assignment => (
              <div key={assignment.id} className="assignment-item">
                <div className="assignment-info">
                  <h4>{assignment.title}</h4>
                  <p className="assignment-class">{assignment.class}</p>
                </div>
                <div className="assignment-due">
                  <span className={`due-badge ${assignment.priority}`}>
                    {getDaysUntilDue(assignment.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-card"
            onClick={() => onTabChange('chat')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none'
            }}
          >
            <div className="quick-action-icon">💬</div>
            <div className="quick-action-content">
              <h4>Chat with AI</h4>
              <p>Get instant help with your studies</p>
            </div>
          </button>
        </div>
      </section>

      {/* Recent Grades */}
      <section className="dashboard-section">
        <div className="section-header">
          <h3>Recent Grades</h3>
          <button className="btn-link" onClick={() => onTabChange('grades')}>View All</button>
        </div>
        <div className="grades-table">
          <table>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Class</th>
                <th>Score</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {recentGrades.map((grade, index) => (
                <tr key={index}>
                  <td>{grade.assignment}</td>
                  <td>{grade.class}</td>
                  <td>{grade.score}/{grade.maxScore}</td>
                  <td><span className="grade-badge">{grade.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default DashboardOverview

