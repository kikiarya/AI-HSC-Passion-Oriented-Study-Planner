import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import teacherApi from '../../services/teacherApi'
import './StudentGradesView.css'

function StudentGradesView({ studentId, onBack }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState(null)
  const [stats, setStats] = useState({ overallGrade: null, gradedAssignments: 0, totalAssignments: 0, submittedCount: 0 })
  const [grades, setGrades] = useState([])
  const [selectedClass, setSelectedClass] = useState('all')
  const [classes, setClasses] = useState([])

  useEffect(() => {
    if (!studentId) {
      setLoading(false)
      return
    }
    
    const fetchStudentGrades = async () => {
      try {
        setLoading(true)
        const res = await teacherApi.getStudentGrades(studentId, selectedClass)
        setStudent(res.student)
        setStats(res.stats || { overallGrade: null, gradedAssignments: 0, totalAssignments: 0, submittedCount: 0 })
        setGrades(res.grades || [])

        const uniqueClasses = [...new Map(
          (res.grades || []).map(g => [g.classCode, { code: g.classCode, name: g.className, color: g.classColor }])
        ).values()]
        setClasses(uniqueClasses)
      } catch (e) {
        console.error('Failed to fetch student grades:', e)
        alert('Failed to fetch student grades')
      } finally {
        setLoading(false)
      }
    }
    fetchStudentGrades()
  }, [studentId, selectedClass])

  const getStatusBadge = (status) => {
    const map = {
      submitted:   { label: 'Submitted',    color: '#3b82f6' },
      graded:      { label: 'Graded',       color: '#10b981' },
      not_submitted:{ label: 'Not Submitted', color: '#ef4444' },
      late:        { label: 'Late',         color: '#f59e0b' }
    }
    const s = map[status] || map.not_submitted
    return <span className="sgvBadge" style={{ background: s.color }}>{s.label}</span>
  }

  const getGradeColor = (p) => {
    if (p == null) return '#9ca3af'
    if (p >= 90) return '#10b981'
    if (p >= 80) return '#3b82f6'
    if (p >= 70) return '#f59e0b'
    if (p >= 60) return '#ef4444'
    return '#ef4444'
  }

  if (loading) {
    return (
      <div className="sgv__center">
        <div className="sgv__spinner" aria-hidden>⏳</div>
        <p>Loading…</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="sgv__center">
        <div className="sgv__spinner" aria-hidden>❌</div>
        <p>Student not found</p>
        <button className="sgvBtn sgvBtn--secondary" onClick={() => navigate('/teacher/students')}>
          Return to students
        </button>
      </div>
    )
  }

  return (
    <div className="student-grades-view sgv">
      {/* Keep this container width 100% so the parent layout (with sidebar) remains intact */}
      <header className="sgv__header">
        <button className="sgvBtn sgvBtn--ghost" onClick={() => {
          if (onBack) {
            onBack()
          } else {
            navigate('/teacher/students')
          }
        }}>
          ← Back to Students
        </button>

        <div className="sgvHero">
          <div className="sgvHero__avatar">
            {student.avatar
              ? <img src={student.avatar} alt={`${student.firstName || ''} ${student.lastName || ''}`} />
              : <div className="sgvHero__placeholder">
                  {(student.firstName?.[0] || student.lastName?.[0] || '?').toUpperCase()}
                </div>
            }
          </div>
          <div className="sgvHero__info">
            <h2 className="sgvHero__name">{student.firstName} {student.lastName}</h2>
            <p className="sgvHero__email">{student.email}</p>
          </div>
        </div>
      </header>

      <section className="sgv__stats">
        <div className="sgvStat">
          <h3>Overall Grade</h3>
          <p className="sgvStat__value" style={{ color: getGradeColor(stats.overallGrade) }}>
            {stats.overallGrade != null ? `${stats.overallGrade}%` : 'N/A'}
          </p>
          <p className="sgvStat__label">Weighted Average</p>
        </div>
        <div className="sgvStat">
          <h3>Graded Assignments</h3>
          <p className="sgvStat__value">{stats.gradedAssignments}/{stats.totalAssignments}</p>
          <p className="sgvStat__label">
            {stats.totalAssignments > 0 ? `${Math.round((stats.gradedAssignments / stats.totalAssignments) * 100)}% graded` : 'No assignments'}
          </p>
        </div>
        <div className="sgvStat">
          <h3>Submission Rate</h3>
          <p className="sgvStat__value">{stats.submittedCount}/{stats.totalAssignments}</p>
          <p className="sgvStat__label">
            {stats.totalAssignments > 0 ? `${Math.round((stats.submittedCount / stats.totalAssignments) * 100)}% submitted` : 'No assignments'}
          </p>
        </div>
      </section>

      <section className="sgv__filter">
        <label htmlFor="classFilter">Filter class:</label>
        <select
          id="classFilter"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="all">All classes</option>
          {classes.map(cls => (
            <option key={cls.code} value={cls.code}>{cls.name}</option>
          ))}
        </select>
      </section>

      <section className="sgv__tableWrap">
        <table className="sgvTable">
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Class</th>
              <th>Due Date</th>
              <th>Total Points</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Weight</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr>
                <td colSpan="8" className="sgvTable__empty">No grade data</td>
              </tr>
            ) : (
              grades.map(grade => (
                <tr key={grade.assignmentId}>
                  <td>
                    <strong>{grade.assignmentTitle}</strong>
                    {grade.feedback && (
                      <div className="sgvFeedback">💬 {grade.feedback}</div>
                    )}
                  </td>
                  <td>
                    <span className="sgvPill" style={{ background: grade.classColor || '#3b82f6' }}>
                      {grade.classCode}
                    </span>
                  </td>
                  <td>
                    {grade.dueDate
                      ? `${new Date(grade.dueDate).toLocaleDateString('en-AU')} ${grade.dueTime || ''}`
                      : 'N/A'}
                  </td>
                  <td>{grade.totalPoints ?? 'N/A'}</td>
                  <td>
                    {grade.grade != null
                      ? <strong style={{ color: getGradeColor(grade.percentage) }}>{grade.grade}</strong>
                      : <span className="sgvMuted">-</span>}
                  </td>
                  <td>
                    {grade.percentage != null
                      ? <span className="sgvPercent" style={{ color: getGradeColor(grade.percentage) }}>{grade.percentage}%</span>
                      : <span className="sgvMuted">-</span>}
                  </td>
                  <td>{grade.weight ? `${grade.weight}%` : 'N/A'}</td>
                  <td>{getStatusBadge(grade.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default StudentGradesView
