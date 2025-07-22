import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState("basic");
  const [draftCount, setDraftCount] = useState(0);
  const [draftLimit, setDraftLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const email = localStorage.getItem("userEmail") || "";
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserInfo() {
      setLoading(true);
      const token = localStorage.getItem("token");
      let userPlan = "basic";
      try {
        const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.user) {
          userPlan = data.user.plan || "basic";
        }
      } catch {}
      setPlan(userPlan);
      let limit = 3;
      if (userPlan === "pro") limit = 6;
      if (userPlan === "pro_max") limit = Infinity;
      setDraftLimit(limit);
      // Fetch draft count
      try {
        const res = await fetch(`/api/sessions?user_email=${encodeURIComponent(email)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setDraftCount((data.sessions || []).length);
        }
      } catch {}
      setLoading(false);
    }
    fetchUserInfo();
  }, [email]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPlan");
    navigate("/login");
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("Please fill all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      return;
    }
    try {
      const res = await fetch("/api/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage(data.message || "Update failed");
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  const handleUpgrade = async (newPlan) => {
    setMessage("");
    const token = localStorage.getItem("token");
    if (!token) return;
    // Payment logic placeholder
    if (newPlan === "pro") {
      if (!window.confirm("Upgrade to Pro for $10?")) return;
    } else if (newPlan === "pro_max") {
      if (!window.confirm("Upgrade to Pro Max for $30?")) return;
    }
    try {
      const res = await fetch("/api/upgrade-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ plan: newPlan })
      });
      const data = await res.json();
      if (res.ok) {
        setPlan(newPlan);
        localStorage.setItem("userPlan", newPlan);
        setMessage(`Plan upgraded to ${newPlan}!`);
        setDraftLimit(newPlan === "pro" ? 6 : newPlan === "pro_max" ? Infinity : 3);
      } else {
        setMessage(data.message || "Upgrade failed");
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f4f6fb", padding: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: 800 }}>
        {/* Password Update Form */}
        <form onSubmit={handleUpdatePassword} style={{ background: "#23242b", padding: 32, borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.18)", minWidth: 320, flex: 1, maxWidth: 400, color: "#f5f6fa" }}>
          <h2 style={{ textAlign: "center", marginBottom: 24, color: '#43cea2' }}>Profile</h2>
          <button onClick={handleLogout} type="button" style={{marginBottom: 24, padding: "8px 20px", fontSize: 15, cursor: "pointer", float: "right", background: '#43cea2', color: '#181a20', border: 'none', borderRadius: 6}}>
            Logout
          </button>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #444", fontSize: 16, background: '#23242b', color: '#f5f6fa' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #444", fontSize: 16, background: '#23242b', color: '#f5f6fa' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #444", fontSize: 16, background: '#23242b', color: '#f5f6fa' }}
            />
          </div>
          {message && <div style={{ color: message.includes("success") ? "#43cea2" : "#ee0979", marginBottom: 12, textAlign: "center" }}>{message}</div>}
          <button type="submit" className="upload-btn" style={{ width: "100%", fontSize: 16, padding: "10px 0", background: '#43cea2', color: '#181a20', border: 'none', borderRadius: 6 }}>Update Password</button>
        </form>
        {/* Subscription Plan Container */}
        <div style={{ background: "#23242b", padding: 32, borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.18)", minWidth: 320, flex: 1, textAlign: 'center', color: "#f5f6fa" }}>
          <h3 style={{ color: '#43cea2', marginBottom: 16 }}>Subscription Plan</h3>
          <div style={{ marginBottom: 12, color: '#43cea2', fontWeight: 600 }}>
            Plan: {loading ? '...' : plan === 'pro_max' ? 'Pro Max' : plan.charAt(0).toUpperCase() + plan.slice(1)}
          </div>
          <div style={{ marginBottom: 12, color: '#43cea2' }}>
            Drafts used: {loading ? '...' : draftCount} / {draftLimit === Infinity ? 'Unlimited' : draftLimit}
          </div>
          {plan !== 'pro_max' && (
            <div style={{ marginBottom: 8 }}>
              <button type="button" onClick={() => handleUpgrade(plan === 'basic' ? 'pro' : 'pro_max')} style={{ padding: '8px 20px', fontSize: 15, background: '#43cea2', color: '#181a20', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Upgrade to {plan === 'basic' ? 'Pro ($10)' : 'Pro Max ($30)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 