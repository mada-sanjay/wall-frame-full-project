import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "./config/config";

function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState("basic");
  const [draftCount, setDraftCount] = useState(0);
  const [draftLimit, setDraftLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const [upgradeRequestStatus, setUpgradeRequestStatus] = useState(null);
  const [requestedPlan, setRequestedPlan] = useState(null);
  const [showRequestSent, setShowRequestSent] = useState(false);
  const [clickedButton, setClickedButton] = useState(null);
  const [showCancelMessage, setShowCancelMessage] = useState(false);
  const email = localStorage.getItem("userEmail") || "";
  const navigate = useNavigate();

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

  useEffect(() => {
    async function fetchUserInfo() {
      setLoading(true);
      const token = localStorage.getItem("token");
      let userPlan = "basic";
      try {
        const res = await fetch(getApiUrl("/me"), { headers: { Authorization: `Bearer ${token}` } });
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
        console.log('🔍 Fetching draft count for email:', email);
        const draftsUrl = getApiUrl(`/sessions?user_email=${encodeURIComponent(email)}`);
        console.log('🔗 Draft count API URL:', draftsUrl);
        
        const res = await fetch(draftsUrl, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        console.log('📡 Draft count response status:', res.status);
        
        const data = await res.json();
        console.log('📦 Draft count response data:', data);
        
        if (res.ok) {
          const count = (data.sessions || []).length;
          console.log('✅ Setting draft count to:', count);
          setDraftCount(count);
        } else {
          console.log('❌ Draft count fetch failed:', data);
        }
      } catch (error) {
        console.log('❌ Draft count fetch error:', error);
      }
      // Fetch upgrade request status
      try {
        const res = await fetch(getApiUrl("/upgrade-request/status"), { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.status) {
          setUpgradeRequestStatus(data.status);
          setRequestedPlan(data.requested_plan);
        } else {
          setUpgradeRequestStatus(null);
          setRequestedPlan(null);
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
      const res = await fetch(getApiUrl("/update-password"), {
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

  // New upgrade request logic
  const handleUpgradeRequest = async (nextPlan) => {
    setMessage("");
    setClickedButton(nextPlan);
    setShowRequestSent(true);
    
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const res = await fetch(getApiUrl("/upgrade-request"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ requested_plan: nextPlan })
      });
      const data = await res.json();
      if (res.ok) {
        setUpgradeRequestStatus("pending");
        setRequestedPlan(nextPlan);
        
        // Hide the request sent message after 3 seconds
        setTimeout(() => {
          setShowRequestSent(false);
          setClickedButton(null);
        }, 3000);
      } else {
        setMessage(data.message || "Upgrade request failed");
        setShowRequestSent(false);
        setClickedButton(null);
      }
    } catch (err) {
      setMessage("Network error");
      setShowRequestSent(false);
      setClickedButton(null);
    }
  };

  // Cancel upgrade request
  const handleCancelRequest = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const res = await fetch(getApiUrl("/upgrade-request/cancel"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUpgradeRequestStatus(null);
        setRequestedPlan(null);
        setShowCancelMessage(true);
        
        // Hide the cancel message after 3 seconds
        setTimeout(() => {
          setShowCancelMessage(false);
        }, 3000);
      } else {
        setMessage(data.message || "Failed to cancel request");
      }
    } catch (err) {
      setMessage("Network error");
    }
  };

  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for getting started",
      draftsLimit: "5 drafts",
      features: [
        "3 draft saves",
        "Basic templates",
        "Standard export",
        "Community support",
        "Email notifications"
      ],
      current: plan === "basic",
      buttonText: "Get Started Free",
      buttonStyle: { background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)", color: "#ffffff" }
    },
    {
      name: "Pro",
      price: "$10/mo",
      description: "For creative professionals",
      draftsLimit: "50 drafts",
      features: [
        "6 draft saves",
        "Premium templates",
        "HD export",
        "Priority support",
        "Advanced tools",
        "Upgrade requests"
      ],
      current: plan === "pro",
      popular: true,
      buttonText: plan === "pro" ? "Current Plan" : (clickedButton === "pro" && showRequestSent ? "Request Sent!" : "Request Upgrade"),
      buttonStyle: plan === "pro" ? 
        { background: "#9ca3af", color: "#ffffff", cursor: "default" } : 
        clickedButton === "pro" && showRequestSent ?
        { background: "#34d399", color: "#ffffff", transform: "scale(1.05)" } :
        { background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)", color: "#ffffff" }
    },
    {
      name: "Pro Max",
      price: "$30/mo",
      description: "For teams and agencies",
      draftsLimit: "Unlimited",
      features: [
        "Unlimited drafts",
        "All templates",
        "4K export",
        "24/7 support",
        "Team collaboration",
        "Custom branding",
        "Admin features"
      ],
      current: plan === "pro_max",
      buttonText: plan === "pro_max" ? "Current Plan" : (clickedButton === "pro_max" && showRequestSent ? "Request Sent!" : "Request Upgrade"),
      buttonStyle: plan === "pro_max" ? 
        { background: "#9ca3af", color: "#ffffff", cursor: "default" } : 
        clickedButton === "pro_max" && showRequestSent ?
        { background: "#34d399", color: "#ffffff", transform: "scale(1.05)" } :
        { background: "linear-gradient(135deg, #f0abfc 0%, #f9a8d4 100%)", color: "#ffffff" }
    }
  ];

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: isDarkMode 
        ? "linear-gradient(135deg, #1f2937 0%, #111827 25%, #1e1b4b 50%, #312e81 75%, #1f2937 100%)" 
        : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 25%, #fef3c7 50%, #e0f2fe 75%, #e0e7ff 100%)", 
      backgroundSize: "400% 400%",
      animation: "gradientShift 20s ease infinite",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            25% { background-position: 100% 50%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          .profile-card {
            animation: fadeInUp 0.6s ease-out;
            animation-fill-mode: both;
          }
          
          .profile-card:nth-child(1) { animation-delay: 0.1s; }
          .profile-card:nth-child(2) { animation-delay: 0.2s; }
          .profile-card:nth-child(3) { animation-delay: 0.3s; }
          .profile-card:nth-child(4) { animation-delay: 0.4s; }
        `}
      </style>

      {/* Dark Mode Toggle Button */}
      <div style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000 
      }}>
        <button
          onClick={toggleDarkMode}
          style={{
            background: isDarkMode ? '#374151' : '#f3f4f6',
            color: isDarkMode ? '#f9fafb' : '#374151',
            border: 'none',
            borderRadius: '50px',
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: isDarkMode
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
              : '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
          }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <span style={{ fontSize: '16px' }}>
            {isDarkMode ? '🌙' : '☀️'}
          </span>
          <span>
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
        </button>
      </div>

      <div style={{ 
        maxWidth: "1400px", 
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "32px"
      }}>
        {/* Enhanced Header with User Info */}
        <div className="profile-card" style={{ 
          background: isDarkMode 
            ? "linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(75, 85, 99, 0.9) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.9) 100%)",
          backdropFilter: "blur(20px)",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: isDarkMode 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.2)"
            : "0 25px 50px -12px rgba(124, 58, 237, 0.15), 0 0 0 1px rgba(124, 58, 237, 0.1)",
          border: `2px solid ${isDarkMode ? "rgba(139, 92, 246, 0.3)" : "rgba(124, 58, 237, 0.2)"}`,
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Background Pattern */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode
              ? "radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)"
              : "radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)",
            pointerEvents: "none",
            zIndex: 0
          }} />
          
          {/* User Avatar */}
          <div style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
            margin: "0 auto 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px", 
            fontWeight: "800", 
            color: "white",
            boxShadow: "0 20px 40px rgba(124, 58, 237, 0.3)",
            position: "relative",
            zIndex: 1,
            animation: "pulse 3s ease-in-out infinite"
          }}>
            {email.charAt(0).toUpperCase()}
          </div>
          
          {/* User Info */}
          <h1 style={{ 
            fontSize: "42px", 
            fontWeight: "800", 
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "8px",
            position: "relative",
            zIndex: 1
          }}>
            Welcome Back!
          </h1>
          
          <p style={{ 
            fontSize: "20px", 
            color: isDarkMode ? "#d1d5db" : "#6b7280", 
            marginBottom: "16px",
            fontWeight: "500",
            position: "relative",
            zIndex: 1
          }}>
            {email}
          </p>
          
          {/* Current Plan Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: plan === "basic" 
              ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)"
              : plan === "pro" 
              ? "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)"
              : "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "50px",
            fontSize: "16px",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0 8px 25px rgba(124, 58, 237, 0.3)",
            marginBottom: "24px",
            position: "relative",
            zIndex: 1
          }}>
            <span style={{ fontSize: "20px" }}>
              {plan === "basic" ? "⭐" : plan === "pro" ? "💎" : "👑"}
            </span>
            {plan.replace("_", " ").toUpperCase()} PLAN
          </div>
          
          {/* Quick Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "16px",
            maxWidth: "600px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1
          }}>
            <div style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.8)" : "rgba(255, 255, 255, 0.8)",
              borderRadius: "16px",
              padding: "16px",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#7c3aed", marginBottom: "4px" }}>
                {draftCount}
              </div>
              <div style={{ fontSize: "14px", color: isDarkMode ? "#d1d5db" : "#6b7280", fontWeight: "500" }}>
                Drafts Created
              </div>
            </div>
            <div style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.8)" : "rgba(255, 255, 255, 0.8)",
              borderRadius: "16px",
              padding: "16px",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#ec4899", marginBottom: "4px" }}>
                {draftLimit === Infinity ? "∞" : draftLimit}
              </div>
              <div style={{ fontSize: "14px", color: isDarkMode ? "#d1d5db" : "#6b7280", fontWeight: "500" }}>
                Draft Limit
              </div>
            </div>
            <div style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.8)" : "rgba(255, 255, 255, 0.8)",
              borderRadius: "16px",
              padding: "16px",
              backdropFilter: "blur(10px)"
            }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "#f59e0b", marginBottom: "4px" }}>
                {Math.round((draftCount / (draftLimit === Infinity ? 100 : draftLimit)) * 100)}%
              </div>
              <div style={{ fontSize: "14px", color: isDarkMode ? "#d1d5db" : "#6b7280", fontWeight: "500" }}>
                Usage
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions Bar */}
        <div className="profile-card" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          background: isDarkMode 
            ? "linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(75, 85, 99, 0.9) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.9) 100%)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: isDarkMode 
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
            : "0 10px 25px -5px rgba(124, 58, 237, 0.08)",
          border: `1px solid ${isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.1)"}`
        }}>
          <button
            onClick={() => navigate('/wall-designer')}
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "16px 20px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "20px" }}>🎨</span>
            Create Design
          </button>
          
          <button
            onClick={() => navigate('/admin')}
            style={{
              background: localStorage.getItem('isAdmin') === '1' 
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "16px 20px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: localStorage.getItem('isAdmin') === '1' ? "pointer" : "not-allowed",
              transition: "all 0.3s ease",
              boxShadow: localStorage.getItem('isAdmin') === '1' 
                ? "0 4px 15px rgba(16, 185, 129, 0.3)"
                : "0 4px 15px rgba(107, 114, 128, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: localStorage.getItem('isAdmin') === '1' ? 1 : 0.6
            }}
            onMouseEnter={(e) => {
              if (localStorage.getItem('isAdmin') === '1') {
                e.target.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (localStorage.getItem('isAdmin') === '1') {
                e.target.style.transform = "translateY(0)";
              }
            }}
            disabled={localStorage.getItem('isAdmin') !== '1'}
          >
            <span style={{ fontSize: "20px" }}>🛠️</span>
            {localStorage.getItem('isAdmin') === '1' ? 'Admin Panel' : 'Admin Only'}
          </button>
          
          <button
            onClick={toggleDarkMode}
            style={{
              background: isDarkMode 
                ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "16px 20px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: isDarkMode 
                ? "0 4px 15px rgba(251, 191, 36, 0.3)"
                : "0 4px 15px rgba(30, 41, 59, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            <span style={{ fontSize: "20px" }}>
              {isDarkMode ? '☀️' : '🌙'}
            </span>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {/* Subscription Plans Section */}
        <div className="profile-card" style={{
          background: isDarkMode 
            ? "linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(75, 85, 99, 0.9) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.9) 100%)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: isDarkMode 
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
            : "0 10px 25px -5px rgba(124, 58, 237, 0.08)",
          border: `1px solid ${isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.1)"}`
        }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h2 style={{ 
              fontSize: "32px", 
              fontWeight: "800", 
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "12px"
          }}>
            Choose Your Plan
            </h2>
          <p style={{ 
            fontSize: "18px", 
              color: isDarkMode ? "#d1d5db" : "#6b7280", 
              marginBottom: "0",
              fontWeight: "500"
          }}>
            Flexible pricing with upgrade request system and admin approval
          </p>
        </div>

        {/* Plans Grid */}
        <div style={{ 
          display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "24px",
            marginBottom: "0"
        }}>
          {plans.map((planData, index) => (
            <div key={index} style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.9)" : "rgba(255, 255, 255, 0.9)",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: planData.popular ? 
                isDarkMode ? "0 25px 50px -12px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.2)" :
                "0 25px 50px -12px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.1)" : 
                isDarkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.2)" :
                "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -1px rgba(0, 0, 0, 0.04)",
              border: planData.popular ? "2px solid #a78bfa" : isDarkMode ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(139, 92, 246, 0.1)",
              position: "relative",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)"
            }}>
              {/* Popular Badge */}
              {planData.popular && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)",
                  color: "#ffffff",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(167, 139, 250, 0.3)"
                }}>
                  Most Popular
                </div>
              )}

              {/* Plan Name */}
              <h3 style={{ 
                fontSize: "24px", 
                fontWeight: "700", 
                color: isDarkMode ? "#f9fafb" : "#4c1d95", 
                marginBottom: "8px",
                textAlign: "center"
              }}>
                {planData.name}
              </h3>

              {/* Price */}
              <div style={{ 
                fontSize: "48px", 
                fontWeight: "800", 
                background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textAlign: "center",
                marginBottom: "8px"
              }}>
                {planData.price}
              </div>

              {/* Description */}
              <p style={{ 
                fontSize: "16px", 
                color: isDarkMode ? "#d1d5db" : "#6b21a8", 
                textAlign: "center", 
                marginBottom: "16px" 
              }}>
                {planData.description}
              </p>

              {/* Draft Limit */}
              <div style={{ 
                background: isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.1)", 
                color: "#a78bfa", 
                padding: "8px 16px", 
                borderRadius: "20px", 
                fontSize: "14px", 
                fontWeight: "600", 
                textAlign: "center", 
                marginBottom: "24px" 
              }}>
                {planData.draftsLimit}
              </div>

              {/* Features */}
              <div style={{ marginBottom: "32px" }}>
                {planData.features.map((feature, featureIndex) => (
                  <div key={featureIndex} style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "12px",
                    fontSize: "16px",
                    color: isDarkMode ? "#d1d5db" : "#6b21a8"
                  }}>
                    <span style={{ 
                      background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      marginRight: "12px",
                      fontSize: "18px",
                      fontWeight: "bold"
                    }}>
                      ✓
                    </span>
                    {feature}
                  </div>
                ))}
              </div>

              {/* Button */}
              <button
                onClick={() => {
                  if (!planData.current && planData.name !== "Basic") {
                    handleUpgradeRequest(planData.name.toLowerCase().replace(" ", "_"));
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  border: "none",
                  cursor: planData.current ? "default" : "pointer",
                  transition: "all 0.3s ease",
                  transform: planData.current ? "none" : "scale(1)",
                  ...planData.buttonStyle
                }}
                onMouseEnter={(e) => {
                  if (!planData.current) {
                    e.target.style.transform = "scale(1.02)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!planData.current) {
                    e.target.style.transform = "scale(1)";
                  }
                }}
              >
                {planData.buttonText}
              </button>
            </div>
          ))}
          </div>
        </div>

        {/* Account Information & Features Section */}
        <div className="profile-card" style={{
          background: isDarkMode 
            ? "linear-gradient(135deg, rgba(55, 65, 81, 0.95) 0%, rgba(75, 85, 99, 0.9) 100%)"
            : "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.9) 100%)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "32px",
          boxShadow: isDarkMode 
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.3)"
            : "0 10px 25px -5px rgba(124, 58, 237, 0.08)",
          border: `1px solid ${isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(124, 58, 237, 0.1)"}`
        }}>
          <h3 style={{ 
            fontSize: "24px", 
            fontWeight: "700", 
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "24px",
            textAlign: "center"
          }}>
            Account Information
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px"
          }}>
            {/* Account Details */}
            <div style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.6)" : "rgba(255, 255, 255, 0.6)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(10px)",
              border: `1px solid ${isDarkMode ? "rgba(139, 92, 246, 0.1)" : "rgba(124, 58, 237, 0.1)"}`,
            }}>
              <h4 style={{ 
                fontSize: "18px", 
                fontWeight: "600", 
                color: isDarkMode ? "#f9fafb" : "#374151", 
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ fontSize: "20px" }}>👤</span>
                Profile Details
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: isDarkMode ? "#d1d5db" : "#6b7280", fontSize: "14px" }}>Email:</span>
                  <span style={{ color: isDarkMode ? "#f9fafb" : "#374151", fontWeight: "500", fontSize: "14px" }}>{email}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: isDarkMode ? "#d1d5db" : "#6b7280", fontSize: "14px" }}>Plan:</span>
                  <span style={{ 
                    color: plan === "basic" ? "#6b7280" : plan === "pro" ? "#7c3aed" : "#ec4899", 
                    fontWeight: "600", fontSize: "14px" 
                  }}>
                    {plan.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: isDarkMode ? "#d1d5db" : "#6b7280", fontSize: "14px" }}>Member Since:</span>
                  <span style={{ color: isDarkMode ? "#f9fafb" : "#374151", fontWeight: "500", fontSize: "14px" }}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: isDarkMode ? "#d1d5db" : "#6b7280", fontSize: "14px" }}>Status:</span>
                  <span style={{ 
                    color: "#10b981", 
                    fontWeight: "600", 
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    <span style={{ fontSize: "12px" }}>🟢</span>
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Access */}
            <div style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.6)" : "rgba(255, 255, 255, 0.6)",
              borderRadius: "16px",
              padding: "20px",
              backdropFilter: "blur(10px)",
              border: `1px solid ${isDarkMode ? "rgba(139, 92, 246, 0.1)" : "rgba(124, 58, 237, 0.1)"}`,
            }}>
              <h4 style={{ 
                fontSize: "18px", 
                fontWeight: "600", 
                color: isDarkMode ? "#f9fafb" : "#374151", 
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ fontSize: "20px" }}>🔓</span>
                Current Access
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { feature: "Draft Creation", enabled: true },
                  { feature: "Basic Templates", enabled: true },
                  { feature: "Standard Export", enabled: true },
                  { feature: "Premium Templates", enabled: plan !== "basic" },
                  { feature: "HD Export", enabled: plan !== "basic" },
                  { feature: "4K Export", enabled: plan === "pro_max" },
                  { feature: "Team Collaboration", enabled: plan === "pro_max" },
                  { feature: "Admin Features", enabled: localStorage.getItem('isAdmin') === '1' }
                ].map((item, index) => (
                  <div key={index} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px"
                  }}>
                    <span style={{ 
                      color: item.enabled ? "#10b981" : "#6b7280",
                      fontSize: "16px"
                    }}>
                      {item.enabled ? "✅" : "❌"}
                    </span>
                    <span style={{ 
                      color: item.enabled 
                        ? (isDarkMode ? "#f9fafb" : "#374151")
                        : (isDarkMode ? "#9ca3af" : "#6b7280"),
                      fontWeight: item.enabled ? "500" : "400"
                    }}>
                      {item.feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>



        {/* Request Sent Message */}
        {showRequestSent && (
          <div style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#10b981",
            color: "#ffffff",
            padding: "16px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.3)",
            zIndex: 1000,
            fontSize: "16px",
            fontWeight: "600",
            animation: "slideIn 0.3s ease-out",
            maxWidth: "300px"
          }}>
            ✅ Request sent successfully! Awaiting admin approval.
          </div>
        )}

        {/* Cancel Message */}
        {showCancelMessage && (
          <div style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#3b82f6",
            color: "#ffffff",
            padding: "16px 24px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)",
            zIndex: 1000,
            fontSize: "16px",
            fontWeight: "600",
            animation: "slideIn 0.3s ease-out",
            maxWidth: "300px"
          }}>
            ✅ Request cancelled successfully!
          </div>
        )}

        {/* Current Status and Profile Settings - Side by Side */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
          marginBottom: "40px"
        }}>
          {/* Current Status */}
          {upgradeRequestStatus && (
            <div style={{
              background: isDarkMode ? "rgba(55, 65, 81, 0.9)" : "rgba(255, 255, 255, 0.9)",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.2)" : "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -1px rgba(0, 0, 0, 0.04)",
              textAlign: "center",
              height: "fit-content",
              backdropFilter: "blur(10px)",
              border: isDarkMode ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(139, 92, 246, 0.1)"
            }}>
              <h3 style={{ 
                fontSize: "20px", 
                fontWeight: "600", 
                color: isDarkMode ? "#f9fafb" : "#4c1d95", 
                marginBottom: "12px" 
              }}>
                Upgrade Request Status
              </h3>
              <div style={{
                padding: "12px 20px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "500",
                background: upgradeRequestStatus === 'pending' ? "#fef3c7" : 
                           upgradeRequestStatus === 'approved' ? "#d1fae5" : "#fee2e2",
                color: upgradeRequestStatus === 'pending' ? "#92400e" : 
                       upgradeRequestStatus === 'approved' ? "#065f46" : "#991b1b"
              }}>
                {upgradeRequestStatus === 'pending' && `Upgrade request to ${requestedPlan} pending admin approval.`}
                {upgradeRequestStatus === 'approved' && `Upgrade to ${requestedPlan} approved!`}
                {upgradeRequestStatus === 'rejected' && `Upgrade to ${requestedPlan} was rejected.`}
              </div>
              {upgradeRequestStatus === 'pending' && (
                <button 
                  onClick={handleCancelRequest}
                  style={{ 
                    width: "100%", 
                    padding: "12px 24px", 
                    borderRadius: "8px", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    background: "linear-gradient(135deg, #fca5a5 0%, #f87171 100%)", 
                    color: "#ffffff", 
                    border: "none",
                    cursor: "pointer",
                    marginTop: "16px",
                    boxShadow: "0 4px 12px rgba(252, 165, 165, 0.3)",
                    transition: "all 0.3s ease"
                  }}
                >
                  Cancel Request
                </button>
              )}
            </div>
          )}

          {/* Profile Settings Section */}
          <div style={{
            background: isDarkMode ? "rgba(55, 65, 81, 0.9)" : "rgba(255, 255, 255, 0.9)",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.2)" : "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -1px rgba(0, 0, 0, 0.04)",
            height: "fit-content",
            backdropFilter: "blur(10px)",
            border: isDarkMode ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(139, 92, 246, 0.1)"
          }}>
            <h3 style={{ 
              fontSize: "24px", 
              fontWeight: "700", 
              color: isDarkMode ? "#f9fafb" : "#4c1d95", 
              marginBottom: "24px",
              textAlign: "center"
            }}>
              Profile Settings
            </h3>
            
            <div style={{ marginBottom: "16px" }}>
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db", 
                  fontSize: "16px",
                  background: isDarkMode ? "#374151" : "#ffffff",
                  color: isDarkMode ? "#f9fafb" : "#374151"
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db", 
                  fontSize: "16px",
                  background: isDarkMode ? "#374151" : "#ffffff",
                  color: isDarkMode ? "#f9fafb" : "#374151"
                }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ 
                  width: "100%", 
                  padding: "12px 16px", 
                  borderRadius: "8px", 
                  border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db", 
                  fontSize: "16px",
                  background: isDarkMode ? "#374151" : "#ffffff",
                  color: isDarkMode ? "#f9fafb" : "#374151"
                }}
              />
            </div>
            {message && (
              <div style={{ 
                color: message.includes("success") ? "#059669" : "#dc2626", 
                marginBottom: "16px", 
                textAlign: "center",
                padding: "8px 12px",
                borderRadius: "6px",
                background: message.includes("success") ? "#d1fae5" : "#fee2e2"
              }}>
                {message}
              </div>
            )}
            <button 
              onClick={handleUpdatePassword}
              style={{ 
                width: "100%", 
                padding: "12px 24px", 
                borderRadius: "8px", 
                fontSize: "16px", 
                fontWeight: "600",
                background: "linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)", 
                color: "#ffffff", 
                border: "none",
                cursor: "pointer",
                marginBottom: "16px",
                boxShadow: "0 4px 12px rgba(167, 139, 250, 0.3)",
                transition: "all 0.3s ease"
              }}
            >
              Update Password
            </button>
            <button 
              onClick={handleLogout}
              style={{ 
                width: "100%", 
                padding: "12px 24px", 
                borderRadius: "8px", 
                fontSize: "16px", 
                fontWeight: "600",
                background: "linear-gradient(135deg, #fca5a5 0%, #f87171 100%)", 
                color: "#ffffff", 
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(252, 165, 165, 0.3)",
                transition: "all 0.3s ease"
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 