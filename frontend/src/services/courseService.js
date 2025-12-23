const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function generateCourseRecommendation({ prompt, model = 'gpt-4.1-nano', maxTokens = 2000 }) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai-agent/course-recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, maxTokens })
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${res.status}`)
    }
    const data = await res.json()
    // Expecting { response: [...] }
    return data?.response || []
  } catch (err) {
    console.error('Course recommendation API failed:', err?.message)
    throw err
  }
}
