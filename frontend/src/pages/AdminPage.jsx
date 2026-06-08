import { useState, useEffect } from 'react';
import { fetchUsers, updateUserRole, deactivateUser } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(null); // id of user being acted on

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchUsers();
        setUsers(data.data.users);
      } catch (err) {
        setError(err.message || 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleRoleChange(id, newRole) {
    setBusy(id);
    setActionError('');
    try {
      const data = await updateUserRole(id, newRole);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: data.data.user.role } : u));
    } catch (err) {
      setActionError(err.message || 'Failed to update role.');
    } finally {
      setBusy(null);
    }
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this user? They will no longer be able to log in.')) return;
    setBusy(id);
    setActionError('');
    try {
      const data = await deactivateUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u));
    } catch (err) {
      setActionError(err.message || 'Failed to deactivate user.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <span className="spinner" />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p>Admin panel — manage all users</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  {u.name}
                  {u.id === currentUser?.id && (
                    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>YOU</span>
                  )}
                </td>
                <td className="text-muted">{u.email}</td>
                <td>
                  <span className={`role-pill ${u.role === 'admin' ? 'admin' : ''}`}>{u.role}</span>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: u.is_active ? 'var(--done)' : 'var(--danger)' }}>
                    {u.is_active ? '● Active' : '● Inactive'}
                  </span>
                </td>
                <td>
                  {u.id !== currentUser?.id && u.is_active && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={busy === u.id}
                        onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                      >
                        {busy === u.id ? '...' : u.role === 'admin' ? 'Make user' : 'Make admin'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={busy === u.id}
                        onClick={() => handleDeactivate(u.id)}
                      >
                        Deactivate
                      </button>
                    </div>
                  )}
                  {u.id === currentUser?.id && <span className="text-muted text-mono">—</span>}
                  {!u.is_active && <span className="text-muted text-mono">Deactivated</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
