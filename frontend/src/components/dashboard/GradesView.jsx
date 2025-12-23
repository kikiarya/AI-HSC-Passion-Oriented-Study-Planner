import { useState } from 'react'
import GeneratePracticeQuestions from './GeneratePracticeQuestions'
import ReviewIncorrectQuestions from './ReviewIncorrectQuestions'

function GradesView({ enrolledClasses, recentGrades }) {
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'practice', or 'review'

  return (
    <>
      {/* Tab Navigation */}
      <div className="grades-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Grades Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'practice' ? 'active' : ''}`}
          onClick={() => setActiveTab('practice')}
        >
          🎯 Generate Practice Questions
        </button>
        <button 
          className={`tab-button ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          📚 Review Practice Questions
        </button>
      </div>

      {/* Grades Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grades-overview">
            <div className="grade-summary-card">
              <h3>Overall Performance</h3>
              <div className="grade-circle">
                <span className="grade-large">A-</span>
              </div>
              <p>Overall GPA: 3.8</p>
            </div>
            <div className="grades-by-subject">
              {enrolledClasses.map(course => (
                <div key={course.id} className="subject-grade">
                  <div className="subject-info">
                    <span className="subject-name">{course.name}</span>
                    <span className="subject-code">{course.code}</span>
                  </div>
                  <span className="subject-grade-badge" style={{ background: `${course.color}20`, color: course.color }}>
                    {course.grade}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <section className="dashboard-section">
            <h3>All Grades</h3>
            <div className="grades-table">
              <table>
                <thead>
                  <tr>
                    <th>Assignment</th>
                    <th>Class</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentGrades.map((grade, index) => (
                    <tr key={index}>
                      <td>{grade.assignment}</td>
                      <td>{grade.class}</td>
                      <td>{grade.score}/{grade.maxScore}</td>
                      <td><span className="grade-badge">{grade.grade}</span></td>
                      <td>Oct {10 + index}, 2025</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Generate Practice Questions Tab */}
      {activeTab === 'practice' && (
        <GeneratePracticeQuestions />
      )}

      {/* Review Incorrect Questions Tab */}
      {activeTab === 'review' && (
        <ReviewIncorrectQuestions />
      )}
    </>
  )
}

export default GradesView

