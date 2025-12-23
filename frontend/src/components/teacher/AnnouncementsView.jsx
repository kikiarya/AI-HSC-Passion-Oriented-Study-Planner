import { useState, useEffect } from 'react'
import teacherApi from '../../services/teacherApi'
import './AnnouncementsView.css'

function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    classId: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [announcementsRes, classesRes] = await Promise.all([
        teacherApi.getAnnouncements(),
        teacherApi.getClasses()
      ])
      setAnnouncements(announcementsRes.announcements || [])
      setClasses(classesRes.classes || [])
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.content || !formData.classId) {
      alert('Please fill in all fields')
      return
    }

    setIsCreating(true)
    try {
      await teacherApi.createAnnouncement(formData)
      // Refresh announcements
      await fetchData()
      // Reset form
      setFormData({ title: '', content: '', classId: '' })
      alert('Announcement posted successfully!')
    } catch (error) {
      console.error('Failed to post announcement:', error)
      alert('Failed to post announcement. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      await teacherApi.deleteAnnouncement(announcementId)
      await fetchData()
      alert('Announcement deleted successfully!')
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      alert('Failed to delete announcement. Please try again.')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading announcements...</p>
      </div>
    )
  }

  return (
    <>
      {/* Create Announcement Section */}
      <div className="announcement-composer">
        <h3>Post New Announcement</h3>
        <form className="assignment-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div className="form-group">
            <label>Class</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              required
            >
              <option value="">Select a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="5"
              placeholder="Enter announcement message..."
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-post"
            disabled={isCreating}
          >
            {isCreating ? 'Posting...' : '📢 Post Announcement'}
          </button>
        </form>
      </div>

      {/* Posted Announcements */}
      <div className="announcements-list-section">
        <h3>Posted Announcements</h3>
        <div className="announcements-list">
          {announcements.length > 0 ? (
            announcements.map(announcement => {
              const announcementClass = classes.find(c => c.id === announcement.classId || c.id === announcement.class_id)
              
              return (
                <div key={announcement.id} className="announcement-card">
                  <div className="announcement-card-header">
                    <h4>{announcement.title}</h4>
                    <div className="announcement-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => handleDelete(announcement.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <span className="class-badge-small">
                    {announcementClass?.name || 'Unknown Class'}
                  </span>

                  <p className="announcement-message">{announcement.content}</p>

                  <div className="announcement-meta">
                    <span>
                      Posted {
                        announcement.created_at 
                          ? new Date(announcement.created_at).toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : new Date().toLocaleString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                      }
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>No announcements posted yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="announcements-tips">
        <h4>💡 Announcement Tips</h4>
        <ul>
          <li>Use clear and concise titles</li>
          <li>Include important dates and deadlines in announcements</li>
          <li>Consider scheduling announcements in advance</li>
          <li>Keep your tone professional and friendly</li>
        </ul>
      </div>
    </>
  )
}

export default AnnouncementsView
