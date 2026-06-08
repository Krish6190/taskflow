import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      const data = await register(form.name, form.email, form.password);
      login(data.data.user);
      navigate('/dashboard');
    } catch (err) {
      // Handle validation errors
      if (err.validationErrors?.length) {
        const fieldErrors = {};
        err.validationErrors.forEach(ve => {
          fieldErrors[ve.field] = ve.message;
        });
        setErrors(fieldErrors);
      } else {
        setApiError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">TASKFLOW_</span>
          <h1>Create account</h1>
          <p>Get started — free forever.</p>
        </div>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              disabled={loading}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              disabled={loading}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
            <span className="field-error" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Min 8 chars, uppercase, lowercase, number
            </span>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
