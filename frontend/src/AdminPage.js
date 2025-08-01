import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl, getAdminApiUrl } from "./config/config";
import config from "./config/config";

const SECTIONS = [
  { key: "analytics", label: "Analytics", icon: "📊" },
  { key: "users", label: "User Management", icon: "👥" },
  { key: "upgrade_requests", label: "Upgrade Requests", icon: "⬆️" },
  { key: "drafts", label: "Draft Management", icon: "📝" },
  { key: "decorations", label: "Decoration Management", icon: "🎨" },
  { key: "moderation", label: "Moderation", icon: "🛡️" },
  { key: "settings", label: "Settings", icon: "⚙️" },
  { key: "feedback", label: "Feedback", icon: "💬" },
  { key: "alerts", label: "Alerts / Notifications", icon: "🔔" },
  { key: "email", label: "Email Notification", icon: "📧" }
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
  const [newDecoration, setNewDecoration] = useState({ name: '', category: '', image: '', status: 'Active', subscription_plan: 'basic' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', message: '' });
  const [emailStatus, setEmailStatus] = useState('');
  const [userEmails, setUserEmails] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Check admin status
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin || isAdmin === "0") {
      alert("Admin access only");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch admin data
  const fetchAdminData = () => {
    const token = localStorage.getItem('token');
    Promise.all([
      fetch(getAdminApiUrl('/users'), { headers: { Authorization: `Bearer ${token}` } }),
      fetch(getAdminApiUrl('/drafts'), { headers: { Authorization: `Bearer ${token}` } }),
      fetch(getAdminApiUrl('/stats'), { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(responses => Promise.all(responses.map(res => res.json())))
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
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Fetch decorations and pending decorations from backend
  useEffect(() => {
    if (section !== 'decorations') return;
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl('/decorations'), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDecorations(data.decorations || []));
          fetch(getAdminApiUrl('/decorations/pending'), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setPendingDecorations(data.decorations || []));
  }, [section]);

  // Fetch all user emails for the email notification dropdown
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl('/user-emails'), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUserEmails(data.emails || []));
  }, []);

  // Fetch upgrade requests when section is selected
  useEffect(() => {
    if (section !== 'upgrade_requests') return;
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl('/upgrade-requests'), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setUpgradeRequests(data.requests || []);
      })
      .catch(error => {
        console.error('Error fetching upgrade requests:', error);
      });
  }, [section]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewDecoration(prev => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload file to server
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('token');
    const response = await fetch(getAdminApiUrl('/upload-image'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      return `${config.api.baseUrl}${data.imageUrl}`;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }
  };

  // Add new decoration (API)
  const handleAddDecoration = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let imageUrl = newDecoration.image;
      
      // If a file is selected, upload it first
      if (selectedFile) {
        imageUrl = await uploadFile(selectedFile);
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(getAdminApiUrl('/decorations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newDecoration, image: imageUrl })
      });
      
      const data = await response.json();
      if (response.ok) {
        setDecorations(prev => [data.decoration, ...prev]);
        setShowAddDecoration(false);
        setNewDecoration({ name: '', category: '', image: '', status: 'Active', subscription_plan: 'basic' });
        setSelectedFile(null);
      } else {
        alert('Failed to add decoration: ' + data.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete decoration (API)
  const handleDeleteDecoration = (id) => {
    if (!window.confirm('Delete this decoration?')) return;
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl(`/decorations/${id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => setDecorations(prev => prev.filter(d => d.id !== id)));
  };

  // Approve pending decoration (API)
  const handleApproveDecoration = (dec) => {
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl(`/decorations/${dec.id}/approve`), {
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
    fetch(getAdminApiUrl(`/decorations/${id}/reject`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => setPendingDecorations(prev => prev.filter(d => d.id !== id)));
  };

  // Promote/demote user
  const handlePromote = (id, isAdmin) => {
    const token = localStorage.getItem("token");
    fetch(getAdminApiUrl(`/users/${id}/promote`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isAdmin: !isAdmin })
    })
      .then(r => r.json())
      .then(() => {
        setUsers(users => users.map(u => u.id === id ? { ...u, isAdmin: !isAdmin } : u));
      });
  };

  // Plan upgrade
  const handleChangePlan = (userEmail, newPlan) => {
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl('/update-plan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userEmail, newPlan })
    })
      .then(r => r.json())
      .then(() => {
        setUsers(users => users.map(u => u.email === userEmail ? { ...u, plan: newPlan } : u));
      });
  };

  // Account deletion
  const handleDeleteUser = (userEmail) => {
    if (!window.confirm('Delete this user?')) return;
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl('/delete-account'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userEmail })
    })
      .then(r => r.json())
      .then(() => {
        setUsers(users => users.filter(u => u.email !== userEmail));
      });
  };

  // Draft deletion
  const handleDeleteDraft = (draftId, userEmail) => {
    if (!window.confirm('Delete this draft?')) return;
    const token = localStorage.getItem('token');
    
    fetch(getAdminApiUrl(`/delete-draft/${draftId}?userEmail=${userEmail}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data.message === 'Draft deleted successfully') {
          // Refresh the drafts data from server to ensure consistency
          fetchAdminData();
        } else {
          alert('Failed to delete draft: ' + (data.message || 'Unknown error'));
        }
      })
      .catch(error => {
        console.error('Error deleting draft:', error);
        alert('Error deleting draft: ' + error.message);
      });
  };

  // Send custom email notification
  const handleSendEmail = async (e) => {
    e.preventDefault();
    setEmailStatus('');
    if (!emailForm.to || !emailForm.subject || !emailForm.message) {
      setEmailStatus('Please fill all fields.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getAdminApiUrl('/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(emailForm)
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus('Email sent successfully!');
        setEmailForm({ to: '', subject: '', message: '' });
      } else {
        setEmailStatus(data.message || 'Failed to send email');
      }
    } catch (err) {
      setEmailStatus('Network error');
    }
  };

  // Approve/reject handlers
  const handleApproveUpgrade = (id) => {
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl(`/upgrade-requests/${id}/approve`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => setUpgradeRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: 'approved' } : r)));
  };
  const handleRejectUpgrade = (id) => {
    const token = localStorage.getItem('token');
    fetch(getAdminApiUrl(`/upgrade-requests/${id}/reject`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => setUpgradeRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: 'rejected' } : r)));
  };

  if (loading) return <div style={{ padding: 40, fontSize: 20 }}>Loading admin data...</div>;
  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>;

  return (
    <div style={{
      display: 'flex',
      maxWidth: 1400,
      margin: '20px auto',
      background: isDarkMode ? '#1f2937' : '#ffffff',
      borderRadius: 20,
      boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.12)',
      minHeight: '90vh',
      color: isDarkMode ? '#f9fafb' : '#1f2937',
      overflow: 'hidden'
    }}>
      {/* Modern Sidebar */}
      <div style={{
        width: 280,
        background: isDarkMode ? 'linear-gradient(180deg, #111827 0%, #1f2937 100%)' : 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
        padding: '32px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 4
      }}>
        <div style={{ padding: '0 24px 24px 24px', borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #475569' }}>
          <h2 style={{ 
            textAlign: 'center', 
            color: '#f8fafc', 
            marginBottom: 8,
            fontSize: '24px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '28px' }}>⚡</span>
            Admin Panel
          </h2>
          <div style={{ 
            textAlign: 'center', 
            color: '#94a3b8', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Dashboard Control Center
          </div>
        </div>
        
        <div style={{ padding: '16px 0', flex: 1 }}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
                background: section === s.key ? (isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)') : 'transparent',
                color: section === s.key ? '#3b82f6' : (isDarkMode ? '#d1d5db' : '#cbd5e1'),
              border: 'none',
                borderRadius: 12,
                padding: '16px 24px',
                margin: '4px 16px',
              fontWeight: 600,
                fontSize: 15,
              cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
                borderLeft: section === s.key ? '4px solid #3b82f6' : '4px solid transparent'
            }}
          >
              <span style={{ fontSize: '18px' }}>{s.icon}</span>
              <span>{s.label}</span>
          </button>
        ))}
      </div>
        
        <div style={{ 
          padding: '16px 24px', 
          borderTop: isDarkMode ? '1px solid #374151' : '1px solid #475569',
          color: '#94a3b8',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Admin Dashboard v2.0
              </div>
              </div>

      {/* Main Content Area */}
            <div style={{
        flex: 1, 
        padding: '32px 40px',
        background: isDarkMode ? '#111827' : '#f8fafc',
        overflowY: 'auto'
            }}>
              <div style={{
                display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: isDarkMode ? '2px solid #374151' : '2px solid #e2e8f0'
              }}>
          <div>
            <h1 style={{ 
              color: isDarkMode ? '#f9fafb' : '#1e293b', 
              marginBottom: '8px',
              fontSize: '32px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '28px' }}>🎯</span>
              {SECTIONS.find(s => s.key === section)?.label || 'Dashboard'}
            </h1>
                <div style={{
              color: isDarkMode ? '#d1d5db' : '#64748b', 
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Manage your platform and monitor user activity
              </div>
          </div>
          
              <div style={{
                display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            background: isDarkMode ? '#374151' : '#ffffff',
            borderRadius: '12px',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
            border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0'
          }}>
            <span style={{ fontSize: '16px' }}>👤</span>
            <span style={{ 
              color: isDarkMode ? '#f9fafb' : '#1e293b', 
              fontWeight: '600',
              fontSize: '14px'
            }}>
              Admin User
            </span>
            
            {/* Dark Mode Toggle Button */}
            <button
              onClick={toggleDarkMode}
              style={{
                background: isDarkMode ? '#374151' : '#f3f4f6',
                color: isDarkMode ? '#f9fafb' : '#374151',
                  border: 'none',
                borderRadius: '50px',
                padding: '6px 12px',
                  cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: isDarkMode
                  ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                marginLeft: '8px'
              }}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span style={{ fontSize: '14px' }}>
                {isDarkMode ? '🌙' : '☀️'}
              </span>
              <span>
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </button>
              </div>
        </div>
        {section === "analytics" && (
          <div>
              <div style={{
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px', 
              marginBottom: '32px' 
            }}>
                <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                borderRadius: 16, 
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)', 
                padding: '24px', 
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  fontSize: '48px', 
                  opacity: '0.2' 
                }}>
                  👥
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: '0.9' }}>Total Users</div>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{stats.userCount}</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>Active accounts</div>
              </div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                borderRadius: 16, 
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)', 
                padding: '24px', 
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  fontSize: '48px', 
                  opacity: '0.2' 
                }}>
                  📝
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: '0.9' }}>Total Drafts</div>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{stats.draftCount}</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>Saved designs</div>
              </div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                borderRadius: 16, 
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)', 
                padding: '24px', 
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  fontSize: '48px', 
                  opacity: '0.2' 
                }}>
                  ⬆️
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: '0.9' }}>Upgrade Requests</div>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{upgradeRequests.filter(r => r.status === 'pending').length}</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>Pending approval</div>
              </div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
                borderRadius: 16, 
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)', 
                padding: '24px', 
                color: '#ffffff',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-10px', 
                  right: '-10px', 
                  fontSize: '48px', 
                  opacity: '0.2' 
                }}>
                  🎨
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', opacity: '0.9' }}>Decorations</div>
                <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{decorations.length}</div>
                <div style={{ fontSize: '12px', opacity: '0.8' }}>Active elements</div>
              </div>
            </div>
            {/* Add more analytics here */}
            <div style={{ color: '#888', fontSize: 15 }}>More analytics coming soon...</div>
          </div>
        )}
        {section === "users" && (
          <section>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '24px' 
            }}>
              <div>
                <h2 style={{ 
                  color: isDarkMode ? '#f9fafb' : '#1e293b', 
                  fontSize: '24px', 
                  marginBottom: '8px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>👥</span>
                  User Management
                </h2>
                <div style={{ color: isDarkMode ? '#d1d5db' : '#64748b', fontSize: '14px' }}>
                  Manage user accounts, permissions, and subscription plans
                </div>
              </div>
              <div style={{
                background: isDarkMode ? '#374151' : '#ffffff',
                padding: '8px 16px',
                borderRadius: '12px',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
                color: isDarkMode ? '#f9fafb' : '#1e293b',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {users.length} Total Users
              </div>
            </div>
            
            <div style={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff', 
              borderRadius: '16px', 
              boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)', 
              overflow: 'hidden',
              border: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0'
            }}>
              <div style={{ 
                background: isDarkMode ? '#111827' : '#f8fafc', 
                padding: '20px 24px',
                borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
                gap: '16px',
                fontWeight: '600',
                color: isDarkMode ? '#d1d5db' : '#475569',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📧</span>
                  Email
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>👑</span>
                  Admin
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>💎</span>
                  Plan
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📅</span>
                  Created
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>⚙️</span>
                  Actions
                </div>
              </div>
              
              <div>
                {users.map((user, index) => (
                  <div key={user.id} style={{ 
                    padding: '20px 24px',
                    borderBottom: index < users.length - 1 ? (isDarkMode ? '1px solid #374151' : '1px solid #f1f5f9') : 'none',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
                    gap: '16px',
                    alignItems: 'center',
                    transition: 'background-color 0.2s ease',
                    background: isDarkMode ? '#1f2937' : 'transparent',
                    ':hover': { background: isDarkMode ? '#374151' : '#f8fafc' }
                  }}>
                    <div style={{ 
                      color: isDarkMode ? '#f9fafb' : '#1e293b', 
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      {user.email}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {user.isAdmin ? (
                        <span style={{
                          background: '#3b82f6',
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Admin
                        </span>
                      ) : (
                        <span style={{
                          background: isDarkMode ? '#374151' : '#f1f5f9',
                          color: isDarkMode ? '#d1d5db' : '#64748b',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          User
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <select
                        value={user.plan || 'basic'}
                        onChange={e => handleChangePlan(user.email, e.target.value)}
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          background: isDarkMode ? '#374151' : '#ffffff', 
                          color: isDarkMode ? '#f9fafb' : '#1e293b', 
                          border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="pro_max">Pro Max</option>
                      </select>
                    </div>
                    <div style={{ 
                      color: isDarkMode ? '#9ca3af' : '#64748b', 
                      fontSize: '13px',
                      textAlign: 'center'
                    }}>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'center' 
                    }}>
                      <button 
                        onClick={() => handlePromote(user.id, user.isAdmin)} 
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: user.isAdmin ? '#64748b' : '#10b981', 
                          color: '#ffffff', 
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {user.isAdmin ? 'Demote' : 'Promote'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.email)} 
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: '#ef4444', 
                          color: '#ffffff', 
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {section === "upgrade_requests" && (
          <section>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '24px' 
            }}>
              <div>
                <h2 style={{ 
                  color: isDarkMode ? '#f9fafb' : '#1e293b', 
                  fontSize: '24px', 
                  marginBottom: '8px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '20px' }}>⬆️</span>
                  Upgrade Requests
                </h2>
                <div style={{ color: isDarkMode ? '#d1d5db' : '#64748b', fontSize: '14px' }}>
                  Review and manage user plan upgrade requests
                </div>
              </div>
              <div style={{
                background: isDarkMode ? '#374151' : '#ffffff',
                padding: '8px 16px',
                borderRadius: '12px',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
                color: isDarkMode ? '#f9fafb' : '#1e293b',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {upgradeRequests.filter(r => r.status === 'pending').length} Pending
              </div>
            </div>
            
            <div style={{ 
              background: isDarkMode ? '#1f2937' : '#ffffff', 
              borderRadius: '16px', 
              boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)', 
              overflow: 'hidden',
              border: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0'
            }}>
              <div style={{ 
                background: isDarkMode ? '#111827' : '#f8fafc', 
                padding: '20px 24px',
                borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
                gap: '16px',
                fontWeight: '600',
                color: isDarkMode ? '#d1d5db' : '#475569',
                fontSize: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>👤</span>
                  User Email
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>💎</span>
                  Requested Plan
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📊</span>
                  Status
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>📅</span>
                  Requested At
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>⚙️</span>
                  Actions
                </div>
              </div>
              
              <div>
                {upgradeRequests.map((req, index) => (
                  <div key={req.id} style={{ 
                    padding: '20px 24px',
                    borderBottom: index < upgradeRequests.length - 1 ? (isDarkMode ? '1px solid #374151' : '1px solid #f1f5f9') : 'none',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
                    gap: '16px',
                    alignItems: 'center',
                    background: isDarkMode ? '#1f2937' : 'transparent'
                  }}>
                    <div style={{ 
                      color: isDarkMode ? '#f9fafb' : '#1e293b', 
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      {req.user_email}
                    </div>
                    <div style={{ 
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '13px',
                      color: isDarkMode ? '#f9fafb' : '#1e293b'
                    }}>
                      {req.requestedPlan || 'N/A'}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {req.status === 'pending' ? (
                        <span style={{
                          background: '#f59e0b',
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Pending
                        </span>
                      ) : req.status === 'approved' ? (
                        <span style={{
                          background: '#10b981',
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Approved
                        </span>
                      ) : (
                        <span style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          Rejected
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      color: isDarkMode ? '#9ca3af' : '#64748b', 
                      fontSize: '13px',
                      textAlign: 'center'
                    }}>
                      {new Date(req.created_at).toLocaleString()}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'center' 
                    }}>
                      {req.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => handleApproveUpgrade(req.id)} 
                            style={{ 
                              padding: '6px 12px', 
                              borderRadius: '8px', 
                              border: 'none', 
                              background: '#10b981', 
                              color: '#ffffff', 
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectUpgrade(req.id)} 
                            style={{ 
                              padding: '6px 12px', 
                              borderRadius: '8px', 
                              border: 'none', 
                              background: '#ef4444', 
                              color: '#ffffff', 
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        {section === "drafts" && (
          <section>
            <h2 style={{ 
              color: isDarkMode ? '#f9fafb' : '#333', 
              fontSize: 22, 
              marginBottom: 16 
            }}>Draft Management</h2>
            <table style={{ 
              width: '100%', 
              background: isDarkMode ? '#1f2937' : '#e0e7ef', 
              borderRadius: 8, 
              boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.18)', 
              borderCollapse: 'collapse',
              border: isDarkMode ? '1px solid #374151' : 'none'
            }}>
              <thead>
                <tr style={{ background: isDarkMode ? '#111827' : '#e0e7ef' }}>
                  <th style={{ 
                    padding: 10, 
                    borderRadius: 8, 
                    textAlign: 'left',
                    color: isDarkMode ? '#f9fafb' : '#333'
                  }}>User Email</th>
                  <th style={{ 
                    padding: 10, 
                    borderRadius: 8,
                    color: isDarkMode ? '#f9fafb' : '#333'
                  }}>Draft Name</th>
                  <th style={{ 
                    padding: 10, 
                    borderRadius: 8,
                    color: isDarkMode ? '#f9fafb' : '#333'
                  }}>Created At</th>
                  <th style={{ 
                    padding: 10, 
                    borderRadius: 8,
                    color: isDarkMode ? '#f9fafb' : '#333'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map(draft => (
                  <tr key={draft.id} style={{ 
                    borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e0e7ef',
                    background: isDarkMode ? '#1f2937' : 'transparent'
                  }}>
                    <td style={{ 
                      padding: 10,
                      color: isDarkMode ? '#f9fafb' : '#333'
                    }}>{draft.userEmail}</td>
                    <td style={{ 
                      padding: 10,
                      color: isDarkMode ? '#f9fafb' : '#333'
                    }}>{draft.name}</td>
                    <td style={{ 
                      padding: 10,
                      color: isDarkMode ? '#d1d5db' : '#333'
                    }}>{new Date(draft.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: 10, textAlign: 'center' }}>
                      <button onClick={() => handleDeleteDraft(draft.id, draft.userEmail)} style={{ 
                        padding: '4px 10px', 
                        borderRadius: 4, 
                        border: 'none', 
                        background: '#d32f2f', 
                        color: '#fff', 
                        cursor: 'pointer' 
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {section === "decorations" && (
          <section>
            <h2 style={{ 
              color: isDarkMode ? '#f9fafb' : '#333', 
              fontSize: 22, 
              marginBottom: 16 
            }}>Decoration Management</h2>
            <button onClick={() => setShowAddDecoration(true)} style={{ 
              marginBottom: 16, 
              padding: '8px 20px', 
              borderRadius: 6, 
              background: '#43cea2', 
              color: '#181a20', 
              border: 'none', 
              fontWeight: 600 
            }}>Add New Decoration</button>
            {/* Add Decoration Modal/Form */}
            {showAddDecoration && (
              <div style={{ 
                background: isDarkMode ? '#1f2937' : '#e0e7ef', 
                borderRadius: 8, 
                padding: 24, 
                marginBottom: 24, 
                boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.18)',
                border: isDarkMode ? '1px solid #374151' : 'none'
              }}>
                <h3 style={{ 
                  marginBottom: 12,
                  color: isDarkMode ? '#f9fafb' : '#333'
                }}>Add Decoration</h3>
                <form onSubmit={handleAddDecoration}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={newDecoration.name}
                      onChange={e => setNewDecoration(d => ({ ...d, name: e.target.value }))}
                      required
                      style={{ 
                        flex: 1, 
                        padding: 8, 
                        borderRadius: 4, 
                        border: isDarkMode ? '1px solid #4b5563' : '1px solid #555', 
                        background: isDarkMode ? '#374151' : '#e0e7ef', 
                        color: isDarkMode ? '#f9fafb' : '#222' 
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={newDecoration.category}
                      onChange={e => setNewDecoration(d => ({ ...d, category: e.target.value }))}
                      required
                      style={{ 
                        flex: 1, 
                        padding: 8, 
                        borderRadius: 4, 
                        border: isDarkMode ? '1px solid #4b5563' : '1px solid #555', 
                        background: isDarkMode ? '#374151' : '#e0e7ef', 
                        color: isDarkMode ? '#f9fafb' : '#222' 
                      }}
                    />
                    <select
                      value={newDecoration.subscription_plan}
                      onChange={e => setNewDecoration(d => ({ ...d, subscription_plan: e.target.value }))}
                      style={{ 
                        padding: 8, 
                        borderRadius: 4, 
                        border: isDarkMode ? '1px solid #4b5563' : '1px solid #555', 
                        background: isDarkMode ? '#374151' : '#e0e7ef', 
                        color: isDarkMode ? '#f9fafb' : '#222',
                        minWidth: '120px'
                      }}
                    >
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="pro_max">Pro Max</option>
                    </select>
                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ 
                          padding: 8, 
                          borderRadius: 4, 
                          border: isDarkMode ? '1px solid #4b5563' : '1px solid #555', 
                          background: isDarkMode ? '#374151' : '#e0e7ef', 
                          color: isDarkMode ? '#f9fafb' : '#222',
                          fontSize: '12px'
                        }}
                      />
                      {newDecoration.image && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img 
                            src={newDecoration.image} 
                            alt="Preview" 
                            style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }}
                          />
                          <span style={{ fontSize: '12px', color: isDarkMode ? '#9ca3af' : '#64748b' }}>
                            {selectedFile ? selectedFile.name : 'Image selected'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={uploading}
                    style={{ 
                      padding: '8px 24px', 
                      borderRadius: 4, 
                      background: uploading ? '#6b7280' : '#43cea2', 
                      color: '#181a20', 
                      border: 'none', 
                      fontWeight: 600,
                      cursor: uploading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {uploading ? 'Uploading...' : 'Add'}
                  </button>
                  <button type="button" onClick={() => setShowAddDecoration(false)} style={{ marginLeft: 12, padding: '8px 24px', borderRadius: 4, background: '#35374a', color: '#b0b3c6', border: 'none', fontWeight: 600 }}>Cancel</button>
                </form>
              </div>
            )}
            <h3 style={{ color: isDarkMode ? '#f9fafb' : '#333' }}>All Decorations</h3>
            <table style={{ 
              width: '100%', 
              background: isDarkMode ? '#1f2937' : '#e0e7ef', 
              borderRadius: 8, 
              boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.18)', 
              borderCollapse: 'collapse', 
              marginBottom: 24,
              border: isDarkMode ? '1px solid #374151' : 'none'
            }}>
              <thead>
                <tr style={{ background: isDarkMode ? '#111827' : '#e0e7ef' }}>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Image</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Name</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Category</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Plan</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Status</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {decorations.filter(dec => dec).map(dec => (
                  <tr key={dec.id} style={{ 
                    borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e0e7ef',
                    background: isDarkMode ? '#1f2937' : 'transparent'
                  }}>
                    <td style={{ padding: 10 }}>
                      {dec.image ? (
                        <img src={dec.image} alt={dec.name} width={40} />
                      ) : (
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          background: isDarkMode ? '#374151' : '#e2e8f0', 
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isDarkMode ? '#9ca3af' : '#64748b',
                          fontSize: '12px'
                        }}>
                          No Image
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>{dec.name}</td>
                    <td style={{ padding: 10, color: isDarkMode ? '#d1d5db' : '#333' }}>{dec.category}</td>
                    <td style={{ padding: 10, color: isDarkMode ? '#d1d5db' : '#333' }}>
                      <span style={{
                        background: dec.subscription_plan === 'basic' ? '#10b981' : 
                                   dec.subscription_plan === 'pro' ? '#3b82f6' : '#8b5cf6',
                        color: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {dec.subscription_plan || 'basic'}
                      </span>
                    </td>
                    <td style={{ padding: 10, color: isDarkMode ? '#d1d5db' : '#333' }}>{dec.status}</td>
                    <td style={{ padding: 10 }}>
                      <button onClick={() => handleDeleteDecoration(dec.id)} style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ color: isDarkMode ? '#f9fafb' : '#333' }}>Pending Approval</h3>
            <table style={{ 
              width: '100%', 
              background: isDarkMode ? '#1f2937' : '#e0e7ef', 
              borderRadius: 8, 
              boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.18)', 
              borderCollapse: 'collapse',
              border: isDarkMode ? '1px solid #374151' : 'none'
            }}>
              <thead>
                <tr style={{ background: isDarkMode ? '#111827' : '#e0e7ef' }}>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Image</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Name</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Category</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDecorations.filter(dec => dec).map(dec => (
                  <tr key={dec.id} style={{ 
                    borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e0e7ef',
                    background: isDarkMode ? '#1f2937' : 'transparent'
                  }}>
                    <td style={{ padding: 10 }}>
                      {dec.image ? (
                        <img src={dec.image} alt={dec.name} width={40} />
                      ) : (
                        <div style={{ 
                          width: 40, 
                          height: 40, 
                          background: isDarkMode ? '#374151' : '#e2e8f0', 
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isDarkMode ? '#9ca3af' : '#64748b',
                          fontSize: '12px'
                        }}>
                          No Image
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>{dec.name}</td>
                    <td style={{ padding: 10, color: isDarkMode ? '#d1d5db' : '#333' }}>{dec.category}</td>
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
            <h2 style={{ color: isDarkMode ? '#f9fafb' : '#333', fontSize: 22, marginBottom: 16 }}>Moderation</h2>
            <div style={{ color: isDarkMode ? '#d1d5db' : '#888', fontSize: 15 }}>Feature coming soon: Review flagged content, ban words/images.</div>
          </section>
        )}
        {section === "settings" && (
          <section>
            <h2 style={{ color: isDarkMode ? '#f9fafb' : '#333', fontSize: 22, marginBottom: 16 }}>Settings</h2>
            <div style={{ color: isDarkMode ? '#d1d5db' : '#888', fontSize: 15 }}>Feature coming soon: App configuration, maintenance mode, announcements.</div>
          </section>
        )}
        {section === "feedback" && (
          <section>
            <h2 style={{ color: isDarkMode ? '#f9fafb' : '#333', fontSize: 22, marginBottom: 16 }}>Feedback</h2>
            <div style={{ color: isDarkMode ? '#d1d5db' : '#888', fontSize: 15 }}>Feature coming soon: View user feedback and respond.</div>
          </section>
        )}
        {section === "alerts" && (
          <section>
            <h2 style={{ color: isDarkMode ? '#f9fafb' : '#333', fontSize: 22, marginBottom: 16 }}>Alerts / Notifications</h2>
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
              style={{ 
                background: isDarkMode ? '#1f2937' : '#e0e7ef', 
                borderRadius: 8, 
                padding: 24, 
                marginBottom: 32, 
                boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.18)',
                border: isDarkMode ? '1px solid #374151' : 'none'
              }}
            >
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Title"
                  value={newAlert.title}
                  onChange={e => setNewAlert(a => ({ ...a, title: e.target.value }))}
                  required
                  style={{ 
                    flex: 1, 
                    padding: 8, 
                    borderRadius: 4, 
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #555', 
                    background: isDarkMode ? '#374151' : '#e0e7ef', 
                    color: isDarkMode ? '#f9fafb' : '#222' 
                  }}
                />
                <select
                  value={newAlert.type}
                  onChange={e => setNewAlert(a => ({ ...a, type: e.target.value }))}
                  style={{ 
                    padding: 8, 
                    borderRadius: 4, 
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #555', 
                    background: isDarkMode ? '#374151' : '#e0e7ef', 
                    color: isDarkMode ? '#f9fafb' : '#222' 
                  }}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="success">Success</option>
                </select>
                <select
                  value={newAlert.audience}
                  onChange={e => setNewAlert(a => ({ ...a, audience: e.target.value }))}
                  style={{ 
                    padding: 8, 
                    borderRadius: 4, 
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #555', 
                    background: isDarkMode ? '#374151' : '#e0e7ef', 
                    color: isDarkMode ? '#f9fafb' : '#222' 
                  }}
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
                style={{ 
                  width: '100%', 
                  padding: 8, 
                  borderRadius: 4, 
                  border: isDarkMode ? '1px solid #4b5563' : '1px solid #555', 
                  background: isDarkMode ? '#374151' : '#e0e7ef', 
                  color: isDarkMode ? '#f9fafb' : '#222',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
              <button type="submit" style={{ marginTop: 12, padding: '8px 24px', borderRadius: 4, background: '#43cea2', color: '#181a20', border: 'none', fontWeight: 600 }}>Create Alert</button>
            </form>
            {/* Alerts List */}
            <table style={{ 
              width: '100%', 
              background: isDarkMode ? '#1f2937' : '#e0e7ef', 
              borderRadius: 8, 
              boxShadow: isDarkMode ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.18)', 
              borderCollapse: 'collapse',
              border: isDarkMode ? '1px solid #374151' : 'none'
            }}>
              <thead>
                <tr style={{ background: isDarkMode ? '#111827' : '#e0e7ef' }}>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Title</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Type</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Audience</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Date</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Status</th>
                  <th style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => (
                  <tr key={alert.id} style={{ 
                    borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e0e7ef',
                    background: isDarkMode ? '#1f2937' : 'transparent'
                  }}>
                    <td style={{ padding: 10, color: isDarkMode ? '#f9fafb' : '#333' }}>{alert.title}</td>
                    <td style={{ padding: 10, color: isDarkMode ? '#d1d5db' : '#333' }}>{alert.type}</td>
                    <td style={{ padding: 10, color: isDarkMode ? '#d1d5db' : '#333' }}>{alert.audience}</td>
                    <td style={{ padding: 10, color: isDarkMode ? '#d1d5db' : '#333' }}>{alert.date}</td>
                    <td style={{ padding: 10, color: isDarkMode ? '#d1d5db' : '#333' }}>{alert.status}</td>
                    <td style={{ padding: 10 }}>
                      <button
                        onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                        style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: '#d32f2f', color: '#fff', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {section === "email" && (
          <div className="section" style={{ maxWidth: 500, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e0e0e0', padding: 24 }}>
            <div className="section-title" style={{ fontSize: 22, marginBottom: 16 }}>Email Notification</div>
            <form onSubmit={handleSendEmail}>
              <div style={{ marginBottom: 12 }}>
                <select
                  value={emailForm.to}
                  onChange={e => setEmailForm(f => ({ ...f, to: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #bbb', fontSize: 16 }}
                  required
                >
                  <option value="">Select user email</option>
                  {userEmails.map(email => (
                    <option key={email} value={email}>{email}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Subject"
                  value={emailForm.subject}
                  onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                  style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #bbb', fontSize: 16 }}
                  required
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <textarea
                  placeholder="Message"
                  value={emailForm.message}
                  onChange={e => setEmailForm(f => ({ ...f, message: e.target.value }))}
                  style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 6, border: '1px solid #bbb', fontSize: 16 }}
                  required
                />
              </div>
              <button type="submit" className="header-button primary" style={{ width: 160, fontSize: 16 }}>Send Email</button>
            </form>
            {emailStatus && <div style={{ marginTop: 14, color: emailStatus.includes('success') ? 'green' : 'red', fontWeight: 600 }}>{emailStatus}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage; 