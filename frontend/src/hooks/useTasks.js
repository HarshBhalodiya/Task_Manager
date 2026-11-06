import { useCallback, useState } from 'react'

// Base URL is configurable per environment; the repo's backend listens on 5000.
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/tasks`

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_URL, {
        headers: getAuthHeaders()
      })
      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return
      }

      if (data.success) {
        setTasks(data.data)
      } else {
        setError('Failed to load tasks')
      }
    } catch (err) {
      setError('Error connecting to server. Make sure backend is running.')
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addTask = useCallback(async (taskData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return { success: false, error: 'Session expired' }
      }

      if (data.success) {
        setTasks(prev => [data.data, ...prev])
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Failed to add task' }
      }
    } catch (err) {
      console.error('Error adding task:', err)
      return { success: false, error: 'Error adding task. Check your connection.' }
    }
  }, [])

  const updateTask = useCallback(async (taskId, taskData) => {
    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(taskData)
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return { success: false, error: 'Session expired' }
      }

      if (data.success) {
        setTasks(prev => prev.map(t => t._id === taskId ? data.data : t))
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Failed to update task' }
      }
    } catch (err) {
      console.error('Error updating task:', err)
      return { success: false, error: 'Error updating task' }
    }
  }, [])

  // Accepts the task object so the callback can stay referentially stable.
  const toggleTaskComplete = useCallback(async (task) => {
    if (!task) return

    return updateTask(task._id, { completed: !task.completed })
  }, [updateTask])

  const deleteTask = useCallback(async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      const data = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return { success: false, error: 'Session expired' }
      }

      if (data.success) {
        setTasks(prev => prev.filter(t => t._id !== taskId))
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Failed to delete task' }
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      return { success: false, error: 'Error deleting task' }
    }
  }, [])

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    loadTasks
  }
}
