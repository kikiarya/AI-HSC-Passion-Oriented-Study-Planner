const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export async function generateCareerPathway({ prompt, model = 'gpt-4.1-nano', maxTokens = 2000 }) {
  try {
    const res = await fetch(`${API_BASE_URL}/ai-agent/career-pathway`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, maxTokens })
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed: ${res.status}`)
    }
    const data = await res.json()
    return data?.response?.[0]
  } catch (err) {
    console.error('Career API failed:', err?.message)
    throw err
  }
}


