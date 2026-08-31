import { useState } from 'react'

function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('❌ Task title is required')
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined
    })

    if (result.success) {
      setTitle('')
      setDescription('')
      alert('✅ Task added successfully!')
    } else {
      alert(`❌ ${result.error}`)
    }
    setSubmitting(false)
  }

  return (
    <div className="task-form-container">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="taskTitle">Task Title *</label>
          <input
            type="text"
            id="taskTitle"
            placeholder="Enter task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="taskDescription">Description</label>
          <textarea
            id="taskDescription"
            rows="3"
            placeholder="Enter task description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Task'}
        </button>
      </form>
    </div>
  )
}

export default TaskForm
