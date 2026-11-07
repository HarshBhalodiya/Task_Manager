import { useState } from 'react'
import { useAiDescription } from '../hooks/useAiDescription'

function TaskForm({ onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    generate,
    generating,
    aiMessage,
    isFallback,
    clearAiMessage
  } = useAiDescription()

  const handleGenerate = async () => {
    if (!title.trim()) {
      alert('❌ Enter a task title first, then generate a description.')
      return
    }

    const result = await generate(title)
    if (result.ok) {
      // Show the AI suggestion as an editable pre-fill the user can accept or
      // modify (Practical 13 step 5).
      setDescription(result.description)
    }
  }

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
      clearAiMessage()
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
          <div className="ai-controls">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGenerate}
              disabled={submitting || generating}
            >
              {generating ? 'Generating…' : '✦ Generate description (AI)'}
            </button>
          </div>
          {aiMessage && (
            <p className={`ai-message ai-message-${aiMessage.type}`}>
              {aiMessage.text}
            </p>
          )}
          <textarea
            id="taskDescription"
            rows="3"
            placeholder="Enter task description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting || generating}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Adding...' : 'Add Task'}
        </button>
        {isFallback && (
          <p className="ai-disclaimer">
            AI description unavailable — this task was created without AI assistance.
          </p>
        )}
        {description && !isFallback && (
          <p className="ai-disclaimer">
            ⚠️ This description was AI-generated and should be reviewed before
            submitting.
          </p>
        )}
      </form>
    </div>
  )
}

export default TaskForm
