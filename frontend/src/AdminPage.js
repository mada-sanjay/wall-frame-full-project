import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [stats, setStats] = useState({ userCount: 0, draftCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Check admin status (assume isAdmin is stored in localStorage after login)
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin || isAdmin === "0") {
      alert("Admin access only");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch all admin data
  useEffect(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    Promise.all([
      fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/admin/drafts", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([userRes, draftRes, statsRes]) => {
        setUsers(userRes.users || []);
        setDrafts(draftRes.drafts || []);
        setStats(statsRes || { userCount: 0, draftCount: 0 });
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load admin data");
        setLoading(false);
      });
  }, []);

  // Promote/demote user
  const handlePromote = (id, isAdmin) => {
    const token = localStorage.getItem("token");
    fetch(`/api/admin/users/${id}/promote`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isAdmin: !isAdmin })
    })
      .then(r => r.json())
      .then(() => {
        setUsers(users => users.map(u => u.id === id ? { ...u, isAdmin: !isAdmin } : u));
      });
  };

  // Delete user
  const handleDeleteUser = (id) => {
    if (!window.confirm("Delete this user?")) return;
    const token = localStorage.getItem("token");
    fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(() => {
        setUsers(users => users.filter(u => u.id !== id));
      });
  };

  // Delete draft
  const handleDeleteDraft = (id) => {
    if (!window.confirm("Delete this draft?")) return;
    const token = localStorage.getItem("token");
    fetch(`/api/admin/drafts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(() => {
        setDrafts(drafts => drafts.filter(d => d.id !== id));
      });
  };

  if (loading) return <div style={{ padding: 40, fontSize: 20 }}>Loading admin data...</div>;
  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', background: '#f7fafd', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>
      <h1 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 32 }}>Admin Dashboard</h1>
      {/* Analytics */}
      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, minWidth: 180, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1976d2' }}>Users</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.userCount}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, minWidth: 180, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1976d2' }}>Drafts</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.draftCount}</div>
        </div>
      </div>
      {/* User Management */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>User Management</h2>
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', borderCollapse: 'collapse', marginBottom: 8 }}>
          <thead>
            <tr style={{ background: '#e3f0fc' }}>
              <th style={{ padding: 10, borderRadius: 8, textAlign: 'left' }}>Email</th>
              <th style={{ padding: 10, borderRadius: 8 }}>Admin</th>
              <th style={{ padding: 10, borderRadius: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 10 }}>{user.email}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>{user.isAdmin ? '✔️' : ''}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <button onClick={() => handlePromote(user.id, user.isAdmin)} style={{ marginRight: 8, padding: '4px 10px', borderRadius: 4, border: 'none', background: user.isAdmin ? '#bbb' : '#1976d2', color: '#fff', cursor: 'pointer' }}>
                    {user.isAdmin ? 'Demote' : 'Promote'}
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {/* Draft Management */}
      <section>
        <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>Draft Management</h2>
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#e3f0fc' }}>
              <th style={{ padding: 10, borderRadius: 8, textAlign: 'left' }}>User Email</th>
              <th style={{ padding: 10, borderRadius: 8 }}>Created At</th>
              <th style={{ padding: 10, borderRadius: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map(draft => (
              <tr key={draft.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 10 }}>{draft.user_email}</td>
                <td style={{ padding: 10 }}>{new Date(draft.created_at).toLocaleString()}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>
                  <button onClick={() => handleDeleteDraft(draft.id)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AdminPage; 