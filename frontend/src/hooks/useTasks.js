import { useState } from 'react'

const API_URL = 'http://localhost:5000/tasks'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(API_URL)
      const data = await response.json()

      if (data.success) {
        setTasks(data.data)
      } else {
        setError('Failed to load tasks')
      }
    } catch (err) {
      setError('Error connecting to server. Make sure backend is running on port 5000.')
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const addTask = async (taskData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })

      const data = await response.json()

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
  }

  const updateTask = async (taskId, taskData) => {
    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })

      const data = await response.json()

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
  }

  const toggleTaskComplete = async (taskId) => {
    const task = tasks.find(t => t._id === taskId)
    if (!task) return

    return updateTask(taskId, { completed: !task.completed })
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const response = await fetch(`${API_URL}/${taskId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

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
  }

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
