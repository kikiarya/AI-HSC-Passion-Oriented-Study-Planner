// Utility functions for dashboard components

export function getDaysUntilDue(dueDate) {
  if (!dueDate) return 'No due date';
  
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return `Due in ${Math.floor(diffDays / 7)} weeks`;
  }
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export function calculateGradeAverage(grades) {
  if (!grades || grades.length === 0) return 0;
  const total = grades.reduce((sum, grade) => {
    const score = (grade.score / grade.maxScore) * 100;
    return sum + score;
  }, 0);
  return Math.round(total / grades.length);
}

