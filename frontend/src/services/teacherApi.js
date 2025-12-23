import authService from './authService.js'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// Use relative API path; base URL is handled by authService (API_BASE_URL)
const API_URL = '/teacher'

class TeacherAPI {
  // Classes
  async getClasses() {
    const response = await authService.authenticatedRequest(`${API_URL}/classes`)
    return response
  }

  // Modules
  async getModules(classId) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes/${classId}/modules`)
    return response
  }

  async createModule(classId, payload) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes/${classId}/modules`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return response
  }

  async updateModule(moduleId, payload) {
    const response = await authService.authenticatedRequest(`${API_URL}/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return response
  }

  async deleteModule(moduleId) {
    const response = await authService.authenticatedRequest(`${API_URL}/modules/${moduleId}`, {
      method: 'DELETE'
    })
    return response
  }

  async createModuleItem(moduleId, payload) {
    const response = await authService.authenticatedRequest(`${API_URL}/modules/${moduleId}/items`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return response
  }

  async updateModuleItem(moduleId, itemId, payload) {
    const response = await authService.authenticatedRequest(`${API_URL}/modules/${moduleId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return response
  }

  async deleteModuleItem(moduleId, itemId) {
    const response = await authService.authenticatedRequest(`${API_URL}/modules/${moduleId}/items/${itemId}`, {
      method: 'DELETE'
    })
    return response
  }

  // Use direct fetch for multipart upload to avoid default JSON headers
  async uploadModuleFile(moduleId, itemId, file) {
    const token = authService.getAccessToken()
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${API_BASE_URL}${API_URL}/modules/${moduleId}/items/${itemId}/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Upload failed')
    }
    return data
  }

  async summarizeModuleItem(moduleId, itemId) {
    const response = await authService.authenticatedRequest(`${API_URL}/modules/${moduleId}/items/${itemId}/summarize`, {
      method: 'POST'
    })
    return response
  }

  async getClassById(classId) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes/${classId}`)
    return response
  }

  async getClassStudents(classId) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes/${classId}/students`)
    return response
  }

  async createClass(classData) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes`, {
      method: 'POST',
      body: JSON.stringify(classData)
    })
    return response
  }

  async updateClass(classId, classData) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes/${classId}`, {
      method: 'PUT',
      body: JSON.stringify(classData)
    })
    return response
  }

  async deleteClass(classId) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes/${classId}`, {
      method: 'DELETE'
    })
    return response
  }

  async enrollStudent(classId, studentId) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes/${classId}/enroll`, {
      method: 'POST',
      body: JSON.stringify({ studentId })
    })
    return response
  }

  async removeStudent(classId, studentId) {
    const response = await authService.authenticatedRequest(`${API_URL}/classes/${classId}/students/${studentId}`, {
      method: 'DELETE'
    })
    return response
  }

  // Assignments
  async getAssignments() {
    const response = await authService.authenticatedRequest(`${API_URL}/assignments`)
    return response
  }

  async getAssignmentById(assignmentId) {
    const response = await authService.authenticatedRequest(`${API_URL}/assignments/${assignmentId}`)
    return response
  }

  async createAssignment(assignmentData) {
    const response = await authService.authenticatedRequest(`${API_URL}/assignments`, {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    })
    return response
  }

  async updateAssignment(assignmentId, assignmentData) {
    const response = await authService.authenticatedRequest(`${API_URL}/assignments/${assignmentId}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData)
    })
    return response
  }

  async deleteAssignment(assignmentId) {
    const response = await authService.authenticatedRequest(`${API_URL}/assignments/${assignmentId}`, {
      method: 'DELETE'
    })
    return response
  }

  async getAssignmentSubmissions(assignmentId) {
    const response = await authService.authenticatedRequest(`${API_URL}/assignments/${assignmentId}/submissions`)
    return response
  }

  async gradeSubmission(assignmentId, submissionId, gradeData) {
    const response = await authService.authenticatedRequest(`${API_URL}/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(gradeData)
    })
    return response
  }

  // Students
  async getStudents() {
    const response = await authService.authenticatedRequest(`${API_URL}/students`)
    return response
  }

  async getAllStudents() {
    const response = await authService.authenticatedRequest(`${API_URL}/students/all-students`)
    return response
  }

  async getStudentProfile(studentId) {
    const response = await authService.authenticatedRequest(`${API_URL}/students/${studentId}`)
    return response
  }

  async getStudentGrades(studentId, classId = 'all') {
    const url = classId && classId !== 'all' 
      ? `${API_URL}/students/${studentId}/grades?classId=${classId}`
      : `${API_URL}/students/${studentId}/grades`
    const response = await authService.authenticatedRequest(url)
    return response
  }

  async updateStudentProfile(studentId, profileData) {
    const response = await authService.authenticatedRequest(`${API_URL}/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
    return response
  }

  // Announcements
  async getAnnouncements() {
    const response = await authService.authenticatedRequest(`${API_URL}/announcements`)
    return response
  }

  async getAnnouncementById(announcementId) {
    const response = await authService.authenticatedRequest(`${API_URL}/announcements/${announcementId}`)
    return response
  }

  async createAnnouncement(announcementData) {
    const response = await authService.authenticatedRequest(`${API_URL}/announcements`, {
      method: 'POST',
      body: JSON.stringify(announcementData)
    })
    return response
  }

  async updateAnnouncement(announcementId, announcementData) {
    const response = await authService.authenticatedRequest(`${API_URL}/announcements/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(announcementData)
    })
    return response
  }

  async deleteAnnouncement(announcementId) {
    const response = await authService.authenticatedRequest(`${API_URL}/announcements/${announcementId}`, {
      method: 'DELETE'
    })
    return response
  }

  // AI Features
  async autoGradeSubmission(submissionId, assignmentId) {
    const response = await authService.authenticatedRequest(`${API_URL}/ai/auto-grade`, {
      method: 'POST',
      body: JSON.stringify({ submission_id: submissionId, assignment_id: assignmentId })
    })
    return response
  }

  async generateRubric(assignmentData) {
    const response = await authService.authenticatedRequest(`${API_URL}/ai/generate-rubric`, {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    })
    return response
  }

  async generateAssignment(params) {
    const response = await authService.authenticatedRequest(`${API_URL}/ai/generate-assignment`, {
      method: 'POST',
      body: JSON.stringify(params)
    })
    return response
  }

  async analyzeClassPerformance(classId) {
    const response = await authService.authenticatedRequest(`${API_URL}/ai/analyze-class`, {
      method: 'POST',
      body: JSON.stringify({ class_id: classId })
    })
    return response
  }

  async summarizeContent(content, contentType) {
    const response = await authService.authenticatedRequest(`${API_URL}/ai/summarize`, {
      method: 'POST',
      body: JSON.stringify({ content, content_type: contentType })
    })
    return response
  }

  // HSC Subjects (for creating classes and assignments)
  async getHSCSubjects() {
    const response = await authService.authenticatedRequest('/hsc-subjects')
    return response
  }

  // Analytics
  async getAnalytics(classId = 'all') {
    const response = await authService.authenticatedRequest(`${API_URL}/analytics${classId && classId !== 'all' ? `?classId=${classId}` : ''}`)
    return response
  }
}

const teacherApi = new TeacherAPI()
export default teacherApi

