import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SECTIONS = [
  { key: "analytics", label: "Analytics" },
  { key: "users", label: "User Management" },
  { key: "drafts", label: "Draft Management" },
  { key: "decorations", label: "Decoration Management" },
  { key: "moderation", label: "Moderation" },
  { key: "settings", label: "Settings" },
  { key: "feedback", label: "Feedback" },
  { key: "alerts", label: "Alerts / Notifications" }, // <-- new section
];

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [stats, setStats] = useState({ userCount: 0, draftCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState("analytics");
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([
    // Example initial alert
    { id: 1, title: "Maintenance Tonight", message: "The app will be down for maintenance at 10pm.", type: "info", audience: "All", date: new Date().toLocaleString(), status: "Active" },
  ]);
  const [newAlert, setNewAlert] = useState({ title: "", message: "", type: "info", audience: "All" });
  const [decorations, setDecorations] = useState([]);
  const [pendingDecorations, setPendingDecorations] = useState([]);
  const [showAddDecoration, setShowAddDecoration] = useState(false);
  const [newDecoration, setNewDecoration] = useState({ name: '', category: '', image: '', status: 'Active' });

  // Check admin status
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

  // Fetch decorations and pending decorations from backend
  useEffect(() => {
    if (section !== 'decorations') return;
    const token = localStorage.getItem('token');
    fetch('/api/admin/decorations', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDecorations(data.decorations || []));
    fetch('/api/admin/decorations/pending', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setPendingDecorations(data.decorations || []));
  }, [section]);

  // Add new decoration (API)
  const handleAddDecoration = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    fetch('/api/admin/decorations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newDecoration)
    })
      .then(res => res.json())
      .then(data => {
        setDecorations(prev => [data.decoration, ...prev]);
        setShowAddDecoration(false);
        setNewDecoration({ name: '', category: '', image: '', status: 'Active' });
      });
  };

  // Delete decoration (API)
  const handleDeleteDecoration = (id) => {
    if (!window.confirm('Delete this decoration?')) return;
    const token = localStorage.getItem('token');
    fetch(`/api/admin/decorations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => setDecorations(prev => prev.filter(d => d.id !== id)));
  };

  // Approve pending decoration (API)
  const handleApproveDecoration = (dec) => {
    const token = localStorage.getItem('token');
    fetch(`/api/admin/decorations/${dec.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setDecorations(prev => [data.decoration, ...prev]);
        setPendingDecorations(prev => prev.filter(d => d.id !== dec.id));
      });
  };

  // Reject pending decoration (API)
  const handleRejectDecoration = (id) => {
    const token = localStorage.getItem('token');
    fetch(`/api/admin/decorations/${id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => setPendingDecorations(prev => prev.filter(d => d.id !== id)));
  };

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
    <div style={{ display: 'flex', maxWidth: 1200, margin: '40px auto', background: '#f7fafd', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minHeight: 600 }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: '#e3f0fc', borderRadius: '16px 0 0 16px', padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
        <h2 style={{ textAlign: 'center', color: '#1976d2', marginBottom: 24 }}>Admin Menu</h2>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              background: section === s.key ? '#1976d2' : 'transparent',
              color: section === s.key ? '#fff' : '#1976d2',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              margin: '0 16px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              marginBottom: 4
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      {/* Main Content */}
      <div style={{ flex: 1, padding: 40 }}>
        <h1 style={{ color: '#1976d2', marginBottom: 32 }}>Admin Dashboard</h1>
        {section === "analytics" && (
          <div>
            <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>Analytics</h2>
            <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, minWidth: 180, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1976d2' }}>Users</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.userCount}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, minWidth: 180, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1976d2' }}>Drafts</div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.draftCount}</div>
              </div>
            </div>
            {/* Add more analytics here */}
            <div style={{ color: '#888', fontSize: 15 }}>More analytics coming soon...</div>
          </div>
        )}
        {section === "users" && (
          <section>
            <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>User Management</h2>
            <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', borderCollapse: 'collapse', marginBottom: 8 }}>
              <thead>
                <tr style={{ background: '#e3f0fc' }}>
                  <th style={{ padding: 10, borderRadius: 8, textAlign: 'left' }}>Email</th>
                  <th style={{ padding: 10, borderRadius: 8 }}>Admin</th>
                  <th style={{ padding: 10, borderRadius: 8 }}>Created At</th>
                  <th style={{ padding: 10, borderRadius: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}>{user.email}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>{user.isAdmin ? '✔️' : ''}</td>
                    <td style={{ padding: 10 }}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
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
        )}
        {section === "drafts" && (
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
                    <td style={{ padding: 10 }}>{new Date(draft.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button onClick={() => handleDeleteDraft(draft.id)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {section === "decorations" && (
          <section>
            <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>Decoration Management</h2>
            <button onClick={() => setShowAddDecoration(true)} style={{ marginBottom: 16, padding: '8px 20px', borderRadius: 6, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600 }}>Add New Decoration</button>
            {/* Add Decoration Modal/Form */}
            {showAddDecoration && (
              <div style={{ background: '#fff', borderRadius: 8, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                <h3 style={{ marginBottom: 12 }}>Add Decoration</h3>
                <form onSubmit={handleAddDecoration}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={newDecoration.name}
                      onChange={e => setNewDecoration(d => ({ ...d, name: e.target.value }))}
                      required
                      style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #bbb' }}
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={newDecoration.category}
                      onChange={e => setNewDecoration(d => ({ ...d, category: e.target.value }))}
                      required
                      style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #bbb' }}
                    />
                    <input
                      type="text"
                      placeholder="Image URL (e.g. /flower-removebg-preview.png)"
                      value={newDecoration.image}
                      onChange={e => setNewDecoration(d => ({ ...d, image: e.target.value }))}
                      required
                      style={{ flex: 2, padding: 8, borderRadius: 4, border: '1px solid #bbb' }}
                    />
                  </div>
                  <button type="submit" style={{ padding: '8px 24px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600 }}>Add</button>
                  <button type="button" onClick={() => setShowAddDecoration(false)} style={{ marginLeft: 12, padding: '8px 24px', borderRadius: 4, background: '#eee', color: '#333', border: 'none', fontWeight: 600 }}>Cancel</button>
                </form>
              </div>
            )}
            <h3>All Decorations</h3>
            <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#e3f0fc' }}>
                  <th style={{ padding: 10 }}>Image</th>
                  <th style={{ padding: 10 }}>Name</th>
                  <th style={{ padding: 10 }}>Category</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {decorations.map(dec => (
                  <tr key={dec.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}><img src={dec.image} alt={dec.name} width={40} /></td>
                    <td style={{ padding: 10 }}>{dec.name}</td>
                    <td style={{ padding: 10 }}>{dec.category}</td>
                    <td style={{ padding: 10 }}>{dec.status}</td>
                    <td style={{ padding: 10 }}>
                      <button onClick={() => handleDeleteDecoration(dec.id)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3>Pending Approval</h3>
            <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e3f0fc' }}>
                  <th style={{ padding: 10 }}>Image</th>
                  <th style={{ padding: 10 }}>Name</th>
                  <th style={{ padding: 10 }}>Category</th>
                  <th style={{ padding: 10 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDecorations.map(dec => (
                  <tr key={dec.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}><img src={dec.image} alt={dec.name} width={40} /></td>
                    <td style={{ padding: 10 }}>{dec.name}</td>
                    <td style={{ padding: 10 }}>{dec.category}</td>
                    <td style={{ padding: 10 }}>
                      <button onClick={() => handleApproveDecoration(dec)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#388e3c', color: '#fff', cursor: 'pointer', marginRight: 8 }}>Approve</button>
                      <button onClick={() => handleRejectDecoration(dec.id)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {section === "moderation" && (
          <section>
            <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>Moderation</h2>
            <div style={{ color: '#888', fontSize: 15 }}>Feature coming soon: Review flagged content, ban words/images.</div>
          </section>
        )}
        {section === "settings" && (
          <section>
            <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>Settings</h2>
            <div style={{ color: '#888', fontSize: 15 }}>Feature coming soon: App configuration, maintenance mode, announcements.</div>
          </section>
        )}
        {section === "feedback" && (
          <section>
            <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>Feedback</h2>
            <div style={{ color: '#888', fontSize: 15 }}>Feature coming soon: View user feedback and respond.</div>
          </section>
        )}
        {section === "alerts" && (
          <section>
            <h2 style={{ color: '#1976d2', fontSize: 22, marginBottom: 16 }}>Alerts / Notifications</h2>
            {/* Create Alert Form */}
            <form
              onSubmit={e => {
                e.preventDefault();
                setAlerts(prev => [
                  { ...newAlert, id: Date.now(), date: new Date().toLocaleString(), status: "Active" },
                  ...prev
                ]);
                setNewAlert({ title: "", message: "", type: "info", audience: "All" });
              }}
              style={{ background: '#fff', borderRadius: 8, padding: 24, marginBottom: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
            >
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Title"
                  value={newAlert.title}
                  onChange={e => setNewAlert(a => ({ ...a, title: e.target.value }))}
                  required
                  style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #bbb' }}
                />
                <select
                  value={newAlert.type}
                  onChange={e => setNewAlert(a => ({ ...a, type: e.target.value }))}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid #bbb' }}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                </select>
                <select
                  value={newAlert.audience}
                  onChange={e => setNewAlert(a => ({ ...a, audience: e.target.value }))}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid #bbb' }}
                >
                  <option value="All">All Users</option>
                  <option value="Admins">Admins Only</option>
                </select>
              </div>
              <textarea
                placeholder="Message"
                value={newAlert.message}
                onChange={e => setNewAlert(a => ({ ...a, message: e.target.value }))}
                required
                style={{ width: '100%', minHeight: 60, padding: 8, borderRadius: 4, border: '1px solid #bbb', marginBottom: 12 }}
              />
              <button type="submit" style={{ padding: '8px 24px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16 }}>Send Alert</button>
            </form>
            {/* Alerts List */}
            <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e3f0fc' }}>
                  <th style={{ padding: 10 }}>Title</th>
                  <th style={{ padding: 10 }}>Type</th>
                  <th style={{ padding: 10 }}>Audience</th>
                  <th style={{ padding: 10 }}>Date</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => (
                  <tr key={alert.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}>{alert.title}</td>
                    <td style={{ padding: 10 }}>{alert.type}</td>
                    <td style={{ padding: 10 }}>{alert.audience}</td>
                    <td style={{ padding: 10 }}>{alert.date}</td>
                    <td style={{ padding: 10 }}>{alert.status}</td>
                    <td style={{ padding: 10 }}>
                      <button
                        onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                        style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}

export default AdminPage; 