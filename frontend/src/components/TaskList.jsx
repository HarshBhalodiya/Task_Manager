import TaskItem from './TaskItem'

function TaskList({ tasks, activeCount, onToggleComplete, onEdit, onDelete, loading, error }) {
  if (loading) {
    return (
      <div className="task-list-container">
        <h2>Your Tasks <span className="task-count">{activeCount}</span></h2>
        <div className="empty-state show">
          <p>Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="task-list-container">
        <h2>Your Tasks <span className="task-count">{activeCount}</span></h2>
        <div className="empty-state show">
          <p style={{ color: 'var(--danger-color)' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="task-list-container">
      <h2>Your Tasks <span className="task-count">{activeCount}</span></h2>
      {tasks.length === 0 ? (
        <div className="empty-state show">
          <p>No tasks yet. Add your first task above!</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map(task => (
            <TaskItem
              key={task._id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TaskList
