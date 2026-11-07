import { useCallback, useState } from 'react'

// Base URL configurable per environment; the repo's backend listens on 5000.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const AI_URL = `${API_BASE}/api/ai/generate-description`

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

/**
 * Calls the backend AI endpoint to generate a task description.
 *
 * Returns a stable object so TaskForm can render a loading state, surface the
 * fallback/rate-limit messages, and keep the suggestion editable.
 */
export function useAiDescription() {
  const [generating, setGenerating] = useState(false)
  const [aiMessage, setAiMessage] = useState(null) // { type, text }
  const [isFallback, setIsFallback] = useState(false)

  const generate = useCallback(async (title) => {
    setGenerating(true)
    setAiMessage(null)
    setIsFallback(false)

    try {
      const response = await fetch(AI_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title })
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return { description: '', ok: false }
      }

      if (!data.success) {
        if (data.rateLimited) {
          setAiMessage({ type: 'warn', text: data.error })
        } else {
          setAiMessage({ type: 'error', text: data.error || 'Could not generate description.' })
        }
        return { description: '', ok: false }
      }

      if (data.data.fallback) {
        setIsFallback(true)
        setAiMessage({
          type: 'warn',
          text: 'AI service unavailable — please write the description manually.'
        })
        return { description: '', ok: false }
      }

      return { description: data.data.description, ok: true }
    } catch (err) {
      console.error('Error generating description:', err)
      setAiMessage({
        type: 'error',
        text: 'Error connecting to AI service. Check that the backend is running.'
      })
      return { description: '', ok: false }
    } finally {
      setGenerating(false)
    }
  }, [])

  const clearAiMessage = useCallback(() => {
    setAiMessage(null)
    setIsFallback(false)
  }, [])

  return { generate, generating, aiMessage, isFallback, clearAiMessage }
}
