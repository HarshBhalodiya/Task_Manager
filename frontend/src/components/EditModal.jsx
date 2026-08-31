import { useState, useEffect } from 'react'

function EditModal({ task, onClose, onSubmit }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [completed, setCompleted] = useState(task.completed)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || '')
    setCompleted(task.completed)
  }, [task])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('❌ Task title is required')
      return
    }

    setSubmitting(true)
    const result = await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      completed
    })

    if (result.success) {
      alert('✅ Task updated successfully!')
      onClose()
    } else {
      alert(`❌ ${result.error}`)
    }
    setSubmitting(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal show" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Task</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="editTaskTitle">Task Title *</label>
            <input
              type="text"
              id="editTaskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="editTaskDescription">Description</label>
            <textarea
              id="editTaskDescription"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                disabled={submitting}
              />
              Mark as completed
            </label>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditModal
