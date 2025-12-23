import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminApi from '../../services/adminApi'

function DashboardOverview() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    loading: true,
    error: null
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      console.log('Loading admin stats...')
      const [studentsRes, teachersRes] = await Promise.all([
        adminApi.getStudents(),
        adminApi.getTeachers()
      ])
      console.log('Students response:', studentsRes)
      console.log('Teachers response:', teachersRes)
      setStats({
        students: studentsRes.students?.length || 0,
        teachers: teachersRes.teachers?.length || 0,
        loading: false
      })
    } catch (err) {
      console.error('Error loading stats:', err)
      setStats(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }

  if (stats.loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-overview">
      <h2>Admin Dashboard</h2>
      <p className="admin-subtitle">Overview of system accounts and management</p>

      {stats.error && (
        <div className="error-message" style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          background: '#fee', 
          borderRadius: '8px', 
          color: '#c33' 
        }}>
          <strong>Error:</strong> {stats.error}
          <br />
          <small>Please check the browser console and backend logs for more details.</small>
        </div>
      )}

      <div className="stats-grid" style={{ marginTop: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.students}</div>
          <div className="stat-label">Total Students</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-value">{stats.teachers}</div>
          <div className="stat-label">Total Teachers</div>
        </div>
      </div>

      <div className="quick-actions-grid" style={{ marginTop: '2rem' }}>
        <div 
          className="action-card" 
          onClick={() => navigate('/admin/students')}
        >
          <div className="action-icon">👥</div>
          <div>
            <h4>Manage Students</h4>
            <p>View and manage all student accounts</p>
          </div>
        </div>

        <div 
          className="action-card" 
          onClick={() => navigate('/admin/teachers')}
        >
          <div className="action-icon">👨‍🏫</div>
          <div>
            <h4>Manage Teachers</h4>
            <p>View and manage all teacher accounts</p>
          </div>
        </div>
      </div>

      <div className="info-box" style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#2d3748' }}>📌 Admin Guidelines</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#4a5568' }}>
          <li>You can create, view, edit, and delete student and teacher accounts</li>
          <li>You can reset passwords for any user account</li>
          <li>When creating a student account, make sure the class code exists</li>
          <li>Deleted accounts cannot be recovered</li>
          <li>All data is read directly from the database - no mock data is used</li>
        </ul>
      </div>
    </div>
  )
}

export default DashboardOverview

