import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import teacherApi from '../../services/teacherApi'
import './StudentsView.css'

function StudentsView() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, classesRes] = await Promise.all([
          teacherApi.getStudents(),
          teacherApi.getClasses()
        ])
        setStudents(studentsRes.students || [])
        setClasses(classesRes.classes || [])
      } catch (error) {
        console.error('Failed to fetch students:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredStudents = students.filter(s => {
    const fn = (s.firstName || s.first_name || '').toLowerCase()
    const ln = (s.lastName || s.last_name || '').toLowerCase()
    const em = (s.email || '').toLowerCase()
    const q = searchTerm.toLowerCase()
    return fn.includes(q) || ln.includes(q) || em.includes(q)
  })

  const formatDate = (d) => {
    if (!d) return 'N/A'
    try {
      return new Date(d).toLocaleDateString()
    } catch {
      return 'N/A'
    }
  }

  const openDrawer = useCallback((student) => {
    setSelectedStudent(student)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    // Let the close animation finish before unmounting data
    setTimeout(() => setSelectedStudent(null), 200)
  }, [])

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [drawerOpen, closeDrawer])

  if (loading) {
    return (
      <div className="sv__center">
        <div className="sv__spinner" aria-hidden>⏳</div>
        <p>Loading students…</p>
      </div>
    )
  }

  return (
    <>
      <div id="students-view" className="sv">
        <div className="sv__header">
          <div className="sv__title">
            <p className="sv__sub">Search and view student details.</p>
          </div>
          <div className="sv__search">
            <input
              type="text"
              className="sv__searchInput"
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search students"
            />
            <span className="sv__searchIcon" aria-hidden>🔍</span>
          </div>
        </div>

        <div className="sv__grid">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const firstName = student.firstName || student.first_name || ''
              const lastName  = student.lastName  || student.last_name  || ''
              const display   = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (student.name || student.email)
              const enrolled  =
                student.classes?.[0]?.enrolledAt ||
                student.enrolled_at ||
                student.created_at

              return (
                <div key={student.id} className="svCard">
                  <div className="svCard__avatar" role="img" aria-label="student avatar">👤</div>
                  <h3 className="svCard__name">{display}</h3>
                  <p className="svCard__email">{student.email}</p>

                  <div className="svCard__meta">
                    <span className="svCard__metaLabel">Enrolled</span>
                    <span className="svCard__metaValue">{formatDate(enrolled)}</span>
                  </div>

                  <div className="svCard__actions">
                    <button
                      className="svBtn svBtn--primary"
                      onClick={() => openDrawer(student)}
                    >
                      View Details
                    </button>
                    <button
                      className="svBtn svBtn--success"
                      onClick={() => navigate(`/teacher/students/${student.id}/grades`)}
                    >
                      View Grades
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="sv__empty">
              <div className="sv__emptyIcon" aria-hidden>👥</div>
              <h3>No Students Found</h3>
              <p>Try a different search term.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Drawer (replaces old modal) */}
      <div className={`svDrawer ${drawerOpen ? 'is-open' : ''}`} aria-hidden={!drawerOpen}>
        <div className="svDrawer__overlay" onClick={closeDrawer} />
        <aside
          className="svDrawer__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Student details"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="svDrawer__header">
            <h3>Student Details</h3>
            <button className="svDrawer__close" onClick={closeDrawer} aria-label="Close">✕</button>
          </div>

          {selectedStudent && (
            <div className="svDrawer__body">
              <div className="svProfile">
                <div className="svProfile__avatar">👤</div>
                <div className="svProfile__info">
                  <h2 className="svProfile__name">
                    {(() => {
                      const firstName = selectedStudent.firstName || selectedStudent.first_name || ''
                      const lastName  = selectedStudent.lastName  || selectedStudent.last_name  || ''
                      const full      = `${firstName} ${lastName}`.trim()
                      return full || selectedStudent.name || selectedStudent.email
                    })()}
                  </h2>
                  <p className="svProfile__email">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="svSection">
                <h4 className="svSection__title">Basic Information</h4>
                <div className="svList">
                  <div className="svList__row">
                    <span className="svList__label">Name</span>
                    <span className="svList__value">
                      {(() => {
                        const fn = selectedStudent.firstName || selectedStudent.first_name || ''
                        const ln = selectedStudent.lastName  || selectedStudent.last_name  || ''
                        const full = `${fn} ${ln}`.trim()
                        return full || selectedStudent.name || 'N/A'
                      })()}
                    </span>
                  </div>
                  <div className="svList__row">
                    <span className="svList__label">Email</span>
                    <span className="svList__value">{selectedStudent.email || 'N/A'}</span>
                  </div>
                  <div className="svList__row">
                    <span className="svList__label">Registered</span>
                    <span className="svList__value">
                      {selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="svList__row svList__row--wrap">
                    <span className="svList__label">Classes</span>
                    <span className="svList__value">
                      {selectedStudent.classes?.length ? (
                        selectedStudent.classes.map((cls, i) => (
                          <span key={cls.id || i} className="svPill">
                            {cls.name || cls.code || 'Unknown'}
                            {cls.code && cls.name && cls.code !== cls.name ? ` (${cls.code})` : ''}
                          </span>
                        ))
                      ) : 'No classes enrolled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="svDrawer__footer">
                <button className="svBtn svBtn--ghost" onClick={closeDrawer}>Close</button>
                <button
                  className="svBtn svBtn--success"
                  onClick={() => {
                    if (selectedStudent?.id) navigate(`/teacher/students/${selectedStudent.id}/grades`)
                  }}
                >
                  Go to Grades
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}

export default StudentsView
