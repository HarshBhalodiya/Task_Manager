import { lazy, Suspense, useCallback, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import TaskForm from '../components/TaskForm';
import FilterButtons from '../components/FilterButtons';
import TaskList from '../components/TaskList';
import PageLoader from '../components/PageLoader';
import { useTasks } from '../hooks/useTasks';

// The edit modal is only needed after the user clicks "Edit", so it is split
// into its own chunk instead of being part of the initial Dashboard bundle.
const EditModal = lazy(() => import('../components/EditModal'));

const Dashboard = () => {
  const { user, logout } = useAuth();
  const {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    loadTasks
  } = useTasks();

  const [currentFilter, setCurrentFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;

  // Stable callbacks so memoized TaskItem rows are not re-rendered when an
  // unrelated task changes (identified with the React DevTools Profiler).
  const handleEditClick = useCallback((task) => {
    setEditingTask(task);
  }, []);

  const handleEditSubmit = useCallback(async (taskData) => {
    await updateTask(editingTask._id, taskData);
    setEditingTask(null);
  }, [editingTask, updateTask]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          <h1>Task Manager</h1>
          <span className="user-email">{user?.email}</span>
        </div>
        <button onClick={logout} className="btn-logout">
          Logout
        </button>
      </div>

      <div className="container">
        <TaskForm onSubmit={addTask} />

        <FilterButtons
          currentFilter={currentFilter}
          onFilterChange={setCurrentFilter}
        />

        <TaskList
          tasks={filteredTasks}
          activeCount={activeCount}
          onToggleComplete={toggleTaskComplete}
          onEdit={handleEditClick}
          onDelete={deleteTask}
          loading={loading}
          error={error}
        />

        {editingTask && (
          <Suspense fallback={<PageLoader label="Loading editor..." />}>
            <EditModal
              task={editingTask}
              onClose={() => setEditingTask(null)}
              onSubmit={handleEditSubmit}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
