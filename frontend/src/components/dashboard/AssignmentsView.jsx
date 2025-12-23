import { getDaysUntilDue } from '../../utils/helpers'
import './AssignmentsView.css'

function AssignmentsView({ upcomingAssignments, onAssignmentClick }) {
  if (upcomingAssignments.length === 0) {
    return (
      <div className="assignments-table">
        <div className="empty-state">
          <div className="emoji">📝</div>
          <h3>No Upcoming Assignments</h3>
          <p>You're all caught up! Check back later for new assignments.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="assignments-table">
      <div className="table-head">
        <div>Assignment</div>
        <div>Priority</div>
        <div>Due</div>
        <div>Status</div>
        <div className="actions-col">Actions</div>
      </div>

      {upcomingAssignments.map(assignment => {
        const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
        
        let dueDateLabel = 'No due date'
        let dueDateTooltip = ''
        if (dueDate) {
          dueDateLabel = `${dueDate.toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
          })}`
          dueDateTooltip = dueDate.toLocaleString(undefined, {
            dateStyle: 'full', timeStyle: 'short'
          })
        }

        return (
          <div key={assignment.id} className="assignment-row">
            {/* Title / class */}
            <div className="title-col">
              <div className="title-line">
                <button
                  className="link-title"
                  onClick={() => onAssignmentClick(assignment.id)}
                  title="Open assignment"
                >
                  {assignment.title}
                </button>
              </div>
              <div className="meta-line">
                <span className="assignment-class-name">{assignment.class}</span>
                <span className="dot" aria-hidden="true">•</span>
                <span title={dueDateTooltip}>{getDaysUntilDue(assignment.dueDate)}</span>
              </div>
            </div>

            {/* Priority */}
            <div className="status-col">
              <span className={`priority-badge ${assignment.priority}`}>
                {assignment.priority}
              </span>
            </div>

            {/* Due */}
            <div className="due-col" title={dueDateTooltip}>{dueDateLabel}</div>

            {/* Status */}
            <div className="points-col">{assignment.status || 'pending'}</div>

            {/* Actions */}
            <div className="actions-col">
              <button
                className="btn-assignment-action btn-view"
                onClick={() => onAssignmentClick(assignment.id)}
                aria-label="View assignment"
                title="View"
              >
                View
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default AssignmentsView
