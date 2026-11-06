import { memo } from 'react'

function TaskItem({ task, onToggleComplete, onEdit, onDelete }) {
  const formattedDate = new Date(task.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task)}
      />
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        {task.description && (
          <div className="task-description">{task.description}</div>
        )}
        <div className="task-date">Created: {formattedDate}</div>
      </div>
      <div className="task-actions">
        <button
          className="icon-btn btn-edit"
          onClick={() => onEdit(task)}
        >
          ✏️ Edit
        </button>
        <button
          className="icon-btn btn-delete"
          onClick={() => onDelete(task._id)}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  )
}

export default memo(TaskItem)
