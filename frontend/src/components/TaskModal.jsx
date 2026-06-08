import { useState, useEffect } from 'react';
import { createTask, updateTask } from '../api/client';

const EMPTY = { title: '', description: '', status: 'todo', priority: 'medium' };

export default function TaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const isEdit = !!task;

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
    setApiError('');
  }, [task]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: '' }));
    setApiError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    setErrors({});
    setLoading(true);

    try {
      let result;
      if (isEdit) {
        result = await updateTask(task.id, form);
      } else {
        result = await createTask(form);
      }
      onSaved(result.data.task);
      onClose();
    } catch (err) {
      if (err.validationErrors?.length) {
        const fieldErrors = {};
        err.validationErrors.forEach(ve => { fieldErrors[ve.field] = ve.message; });
        setErrors(fieldErrors);
      } else {
        setApiError(err.message || 'Failed to save task.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? 'Edit task' : 'New task'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              className={errors.title ? 'error' : ''}
              disabled={loading}
              placeholder="What needs to be done?"
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={errors.description ? 'error' : ''}
              disabled={loading}
              placeholder="Optional details..."
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={form.status} onChange={handleChange} disabled={loading}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange} disabled={loading}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (isEdit ? 'Save changes' : 'Create task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
