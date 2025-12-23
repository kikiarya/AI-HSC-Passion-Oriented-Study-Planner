import { SendEmailCommand } from '@aws-sdk/client-ses';
import { getSESClient } from '../clients/sesClient.js';

/**
 * Send weekly report email via Amazon SES
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {Object} options.weeklyReport - Weekly report data
 * @param {string} options.recipientName - Name of the recipient (student or parent)
 * @param {string} options.recipientType - Type of recipient ('student' or 'parent')
 * @returns {Promise<Object>} Email send result
 */
export const sendWeeklyReportEmail = async ({ to, subject, weeklyReport, recipientName, recipientType = 'student' }) => {
  try {
    // Validate email address
    if (!to || !isValidEmail(to)) {
      throw new Error('Valid recipient email address is required');
    }

    // Validate sender email
    const fromEmail = process.env.AWS_SES_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error('AWS_SES_FROM_EMAIL is not configured in environment variables');
    }

    // Format the weekly report into HTML
    const htmlBody = formatWeeklyReportHTML(weeklyReport, recipientName, recipientType);
    const textBody = formatWeeklyReportText(weeklyReport, recipientName, recipientType);

    // Create email command
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    // Send email
    const sesClient = getSESClient();
    const response = await sesClient.send(command);

    console.log('Email sent successfully:', {
      messageId: response.MessageId,
      to,
      subject,
    });

    return {
      success: true,
      messageId: response.MessageId,
      recipient: to,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Format weekly report as HTML email
 */
function formatWeeklyReportHTML(report, recipientName, recipientType) {
  const greeting = recipientType === 'parent' 
    ? `Dear ${recipientName},<br><br>Here is the weekly academic report for ${report.student_name}.`
    : `Dear ${report.student_name || recipientName},<br><br>Here is your weekly academic report.`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4a90e2;
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .section {
      background-color: white;
      margin: 20px 0;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .section-title {
      color: #4a90e2;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 15px;
      border-bottom: 2px solid #4a90e2;
      padding-bottom: 10px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 15px 0;
    }
    .summary-item {
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    .summary-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    .summary-value {
      font-size: 24px;
      font-weight: bold;
      color: #4a90e2;
      margin-top: 5px;
    }
    .course-item {
      border-left: 4px solid #4a90e2;
      padding: 15px;
      margin: 10px 0;
      background-color: #f9f9f9;
    }
    .assignment-item {
      padding: 10px;
      margin: 8px 0;
      border-left: 3px solid #28a745;
      background-color: #f8f9fa;
    }
    .upcoming-item {
      padding: 10px;
      margin: 8px 0;
      border-left: 3px solid #ffc107;
      background-color: #fff9e6;
    }
    .focus-areas {
      list-style: none;
      padding: 0;
    }
    .focus-areas li {
      padding: 10px;
      margin: 8px 0;
      background-color: #e3f2fd;
      border-radius: 5px;
    }
    .insight-box {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 15px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #666;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
    .status-on-track { background-color: #d4edda; color: #155724; }
    .status-needs-attention { background-color: #fff3cd; color: #856404; }
    .status-excellent { background-color: #d1ecf1; color: #0c5460; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 Weekly Academic Report</h1>
    <p>${report.report_week_start} to ${report.report_week_end}</p>
  </div>
  
  <div class="content">
    <p>${greeting}</p>
    
    <!-- Summary Section -->
    <div class="section">
      <div class="section-title">📊 Weekly Summary</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">Attendance Rate</div>
          <div class="summary-value">${report.summary?.attendance_rate || 0}%</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Average Score</div>
          <div class="summary-value">${report.summary?.average_score || 0}%</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Progress Change</div>
          <div class="summary-value">${report.summary?.progress_change || 'N/A'}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Status</div>
          <div class="summary-value">
            <span class="status-badge ${getStatusClass(report.summary?.status)}">
              ${report.summary?.status || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Study Time Summary -->
    ${report.study_time_summary ? `
    <div class="section">
      <div class="section-title">⏰ Study Time Summary</div>
      <p><strong>Total Study Hours:</strong> ${report.study_time_summary.total_study_hours || 0} hours</p>
      <p><strong>Average Daily Hours:</strong> ${report.study_time_summary.average_daily_hours || 0} hours</p>
      <p><strong>Most Studied Subject:</strong> ${report.study_time_summary.most_studied_subject || 'N/A'}</p>
      ${report.study_time_summary.time_by_subject && report.study_time_summary.time_by_subject.length > 0 ? `
        <div style="margin-top: 15px;">
          <strong>Time by Subject:</strong>
          ${report.study_time_summary.time_by_subject.map(item => `
            <div style="margin: 5px 0; padding: 8px; background-color: #f5f5f5; border-radius: 4px;">
              ${item.subject}: <strong>${item.hours}</strong> hours
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Course Performance -->
    ${report.courses && report.courses.length > 0 ? `
    <div class="section">
      <div class="section-title">📖 Course Performance</div>
      ${report.courses.map(course => `
        <div class="course-item">
          <h3 style="margin: 0 0 10px 0; color: #333;">${course.course_name}</h3>
          <p><strong>Teacher:</strong> ${course.teacher_name || 'N/A'}</p>
          <p><strong>Attendance:</strong> ${course.attendance || 'N/A'}</p>
          <p><strong>Weekly Score:</strong> ${course.weekly_score || 'N/A'}${typeof course.weekly_score === 'number' ? '%' : ''}</p>
          <p><strong>Progress:</strong> ${course.weekly_progress ? (course.weekly_progress * 100).toFixed(0) + '%' : 'N/A'}</p>
          <p><strong>Assignments Submitted:</strong> ${course.assignments_submitted || 0}</p>
          ${course.feedback ? `<p style="margin-top: 10px; font-style: italic; color: #666;">"${course.feedback}"</p>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Assignments -->
    <div class="section">
      <div class="section-title">📝 Assignments</div>
      
      ${report.assignments?.completed_this_week && report.assignments.completed_this_week.length > 0 ? `
        <h4 style="color: #28a745;">✅ Completed This Week</h4>
        ${report.assignments.completed_this_week.map(assignment => `
          <div class="assignment-item">
            <strong>${assignment.title}</strong> - ${assignment.course_name}<br>
            Submitted: ${assignment.submitted_on || 'N/A'}
            ${assignment.score !== null && assignment.score !== undefined ? ` | Score: <strong>${assignment.score}</strong>` : ''}
          </div>
        `).join('')}
      ` : '<p>No assignments completed this week.</p>'}

      ${report.assignments?.upcoming_deadlines && report.assignments.upcoming_deadlines.length > 0 ? `
        <h4 style="color: #ffc107; margin-top: 20px;">⏳ Upcoming Deadlines</h4>
        ${report.assignments.upcoming_deadlines.map(assignment => `
          <div class="upcoming-item">
            <strong>${assignment.title}</strong> - ${assignment.course_name}<br>
            Due: <strong>${assignment.due_date || 'N/A'}</strong>
          </div>
        `).join('')}
      ` : '<p style="margin-top: 15px;">No upcoming deadlines.</p>'}
    </div>

    <!-- Focus Areas -->
    ${report.top_3_focus_areas_next_week && report.top_3_focus_areas_next_week.length > 0 ? `
    <div class="section">
      <div class="section-title">🎯 Focus Areas for Next Week</div>
      <ul class="focus-areas">
        ${report.top_3_focus_areas_next_week.map(area => `<li>✓ ${area}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- Weekly Insight -->
    ${report.weekly_insight ? `
    <div class="section">
      <div class="section-title">💡 Weekly Insight</div>
      ${report.weekly_insight.summary ? `<p><strong>Summary:</strong> ${report.weekly_insight.summary}</p>` : ''}
      ${report.weekly_insight.highlight ? `
        <div class="insight-box">
          <strong>🌟 Highlight:</strong> ${report.weekly_insight.highlight}
        </div>
      ` : ''}
      ${report.weekly_insight.recommendation ? `<p><strong>Recommendation:</strong> ${report.weekly_insight.recommendation}</p>` : ''}
    </div>
    ` : ''}

    <!-- AI Analysis -->
    ${report.ai_analysis ? `
    <div class="section">
      <div class="section-title">🤖 AI Analysis</div>
      ${report.ai_analysis.strengths && report.ai_analysis.strengths.length > 0 ? `
        <h4 style="color: #28a745;">💪 Strengths</h4>
        <ul>
          ${report.ai_analysis.strengths.map(strength => `<li>${strength}</li>`).join('')}
        </ul>
      ` : ''}
      ${report.ai_analysis.areas_for_improvement && report.ai_analysis.areas_for_improvement.length > 0 ? `
        <h4 style="color: #ffc107;">📈 Areas for Improvement</h4>
        <ul>
          ${report.ai_analysis.areas_for_improvement.map(area => `<li>${area}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
    ` : ''}

    <div class="footer">
      <p>This report was generated automatically on ${new Date(report.generated_at || Date.now()).toLocaleString()}.</p>
      <p>For questions or concerns, please contact your teacher or school administrator.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Format weekly report as plain text email
 */
function formatWeeklyReportText(report, recipientName, recipientType) {
  const greeting = recipientType === 'parent' 
    ? `Dear ${recipientName},\n\nHere is the weekly academic report for ${report.student_name}.`
    : `Dear ${report.student_name || recipientName},\n\nHere is your weekly academic report.`;

  let text = `WEEKLY ACADEMIC REPORT\n`;
  text += `${report.report_week_start} to ${report.report_week_end}\n`;
  text += `${'='.repeat(60)}\n\n`;
  text += `${greeting}\n\n`;

  // Summary
  if (report.summary) {
    text += `WEEKLY SUMMARY\n`;
    text += `${'-'.repeat(60)}\n`;
    text += `Attendance Rate: ${report.summary.attendance_rate || 0}%\n`;
    text += `Average Score: ${report.summary.average_score || 0}%\n`;
    text += `Progress Change: ${report.summary.progress_change || 'N/A'}\n`;
    text += `Status: ${report.summary.status || 'N/A'}\n\n`;
  }

  // Study Time
  if (report.study_time_summary) {
    text += `STUDY TIME SUMMARY\n`;
    text += `${'-'.repeat(60)}\n`;
    text += `Total Study Hours: ${report.study_time_summary.total_study_hours || 0} hours\n`;
    text += `Average Daily Hours: ${report.study_time_summary.average_daily_hours || 0} hours\n`;
    text += `Most Studied Subject: ${report.study_time_summary.most_studied_subject || 'N/A'}\n`;
    if (report.study_time_summary.time_by_subject && report.study_time_summary.time_by_subject.length > 0) {
      text += `\nTime by Subject:\n`;
      report.study_time_summary.time_by_subject.forEach(item => {
        text += `  - ${item.subject}: ${item.hours} hours\n`;
      });
    }
    text += `\n`;
  }

  // Courses
  if (report.courses && report.courses.length > 0) {
    text += `COURSE PERFORMANCE\n`;
    text += `${'-'.repeat(60)}\n`;
    report.courses.forEach(course => {
      text += `\n${course.course_name}\n`;
      text += `  Teacher: ${course.teacher_name || 'N/A'}\n`;
      text += `  Attendance: ${course.attendance || 'N/A'}\n`;
      text += `  Weekly Score: ${course.weekly_score || 'N/A'}${typeof course.weekly_score === 'number' ? '%' : ''}\n`;
      text += `  Progress: ${course.weekly_progress ? (course.weekly_progress * 100).toFixed(0) + '%' : 'N/A'}\n`;
      text += `  Assignments Submitted: ${course.assignments_submitted || 0}\n`;
      if (course.feedback) {
        text += `  Feedback: "${course.feedback}"\n`;
      }
    });
    text += `\n`;
  }

  // Assignments
  text += `ASSIGNMENTS\n`;
  text += `${'-'.repeat(60)}\n`;
  if (report.assignments?.completed_this_week && report.assignments.completed_this_week.length > 0) {
    text += `\nCompleted This Week:\n`;
    report.assignments.completed_this_week.forEach(assignment => {
      text += `  - ${assignment.title} (${assignment.course_name})\n`;
      text += `    Submitted: ${assignment.submitted_on || 'N/A'}`;
      if (assignment.score !== null && assignment.score !== undefined) {
        text += ` | Score: ${assignment.score}`;
      }
      text += `\n`;
    });
  } else {
    text += `\nNo assignments completed this week.\n`;
  }

  if (report.assignments?.upcoming_deadlines && report.assignments.upcoming_deadlines.length > 0) {
    text += `\nUpcoming Deadlines:\n`;
    report.assignments.upcoming_deadlines.forEach(assignment => {
      text += `  - ${assignment.title} (${assignment.course_name})\n`;
      text += `    Due: ${assignment.due_date || 'N/A'}\n`;
    });
  } else {
    text += `\nNo upcoming deadlines.\n`;
  }
  text += `\n`;

  // Focus Areas
  if (report.top_3_focus_areas_next_week && report.top_3_focus_areas_next_week.length > 0) {
    text += `FOCUS AREAS FOR NEXT WEEK\n`;
    text += `${'-'.repeat(60)}\n`;
    report.top_3_focus_areas_next_week.forEach((area, index) => {
      text += `${index + 1}. ${area}\n`;
    });
    text += `\n`;
  }

  // Weekly Insight
  if (report.weekly_insight) {
    text += `WEEKLY INSIGHT\n`;
    text += `${'-'.repeat(60)}\n`;
    if (report.weekly_insight.summary) {
      text += `Summary: ${report.weekly_insight.summary}\n\n`;
    }
    if (report.weekly_insight.highlight) {
      text += `Highlight: ${report.weekly_insight.highlight}\n\n`;
    }
    if (report.weekly_insight.recommendation) {
      text += `Recommendation: ${report.weekly_insight.recommendation}\n`;
    }
    text += `\n`;
  }

  // AI Analysis
  if (report.ai_analysis) {
    text += `AI ANALYSIS\n`;
    text += `${'-'.repeat(60)}\n`;
    if (report.ai_analysis.strengths && report.ai_analysis.strengths.length > 0) {
      text += `\nStrengths:\n`;
      report.ai_analysis.strengths.forEach(strength => {
        text += `  - ${strength}\n`;
      });
    }
    if (report.ai_analysis.areas_for_improvement && report.ai_analysis.areas_for_improvement.length > 0) {
      text += `\nAreas for Improvement:\n`;
      report.ai_analysis.areas_for_improvement.forEach(area => {
        text += `  - ${area}\n`;
      });
    }
    text += `\n`;
  }

  text += `${'-'.repeat(60)}\n`;
  text += `This report was generated automatically on ${new Date(report.generated_at || Date.now()).toLocaleString()}.\n`;
  text += `For questions or concerns, please contact your teacher or school administrator.\n`;

  return text;
}

/**
 * Get CSS class for status badge
 */
function getStatusClass(status) {
  if (!status) return '';
  const statusLower = status.toLowerCase();
  if (statusLower.includes('excellent') || statusLower.includes('outstanding')) {
    return 'status-excellent';
  }
  if (statusLower.includes('attention') || statusLower.includes('concern')) {
    return 'status-needs-attention';
  }
  return 'status-on-track';
}

/**
 * Validate email address format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

