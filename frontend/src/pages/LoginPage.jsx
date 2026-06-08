import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
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
      const data = await apiLogin(form.email, form.password);
      login(data.data.user);
      navigate('/dashboard');
    } catch (err) {
      if (err.validationErrors?.length) {
        const fieldErrors = {};
        err.validationErrors.forEach(ve => { fieldErrors[ve.field] = ve.message; });
        setErrors(fieldErrors);
      } else {
        setApiError(err.message || 'Login failed.');
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
          <h1>Welcome back</h1>
          <p>Log in to your workspace.</p>
        </div>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
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
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              disabled={loading}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Log in'}
          </button>
        </form>

        <div className="auth-footer">
          No account? <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
