import { useState, useEffect, useCallback } from 'react';
import { fetchTasks, deleteTask } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      onDelete(task.id);
    } catch (err) {
      // Display error without showing task data
      alert(err.message || 'Failed to delete task.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="task-card">
      <div className="task-card-body">
        <div className="task-card-title">{task.title}</div>
        {task.description && (
          <div className="task-card-desc">{task.description}</div>
        )}
        <div className="task-card-meta">
          <span className={`pill pill-${task.status}`}>{STATUS_LABELS[task.status]}</span>
          <span className={`pill pill-${task.priority}`}>{task.priority}</span>
          {task.owner_name && (
            <span className="text-muted text-mono">{task.owner_name}</span>
          )}
        </div>
      </div>
      <div className="task-card-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? '...' : 'Del'}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', page: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTasks({ ...filters, limit: 20 });
      setTasks(data.data.tasks);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  function openCreate() { setEditTask(null); setModalOpen(true); }
  function openEdit(task) { setEditTask(task); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditTask(null); }

  function handleSaved(savedTask) {
    setTasks(prev => {
      const exists = prev.find(t => t.id === savedTask.id);
      if (exists) return prev.map(t => t.id === savedTask.id ? savedTask : t);
      return [savedTask, ...prev];
    });
  }

  function handleDeleted(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  const counts = {
    total: pagination.total || 0,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Welcome back, {user?.name}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New task</button>
      </div>

      <div className="stats-row">
        <StatCard label="Total" value={counts.total} color="var(--text)" />
        <StatCard label="To Do" value={counts.todo} color="var(--todo)" />
        <StatCard label="In Progress" value={counts.in_progress} color="var(--progress)" />
        <StatCard label="Done" value={counts.done} color="var(--done)" />
      </div>

      <div className="filter-bar">
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filters.priority}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))}
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="btn btn-ghost btn-sm" onClick={loadTasks} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : 'Refresh'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && tasks.length === 0 && !error && (
        <div className="empty">
          <div className="empty-icon">◻</div>
          <p>No tasks yet. Create one to get started.</p>
        </div>
      )}

      <div className="task-grid">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onEdit={openEdit} onDelete={handleDeleted} />
        ))}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'center' }}>
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i + 1}
              className={`btn btn-ghost btn-sm ${filters.page === i + 1 ? 'active' : ''}`}
              style={filters.page === i + 1 ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
              onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {modalOpen && (
        <TaskModal task={editTask} onClose={closeModal} onSaved={handleSaved} />
      )}
    </>
  );
}
