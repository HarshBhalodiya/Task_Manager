import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import TaskForm from '../components/TaskForm';
import FilterButtons from '../components/FilterButtons';
import TaskList from '../components/TaskList';
import EditModal from '../components/EditModal';
import { useTasks } from '../hooks/useTasks';
import { useState, useEffect } from 'react';

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
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'active') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true;
  });

  const activeCount = tasks.filter(t => !t.completed).length;

  const handleEditClick = (task) => {
    setEditingTask(task);
  };

  const handleEditSubmit = async (taskData) => {
    await updateTask(editingTask._id, taskData);
    setEditingTask(null);
  };

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
          <EditModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSubmit={handleEditSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
