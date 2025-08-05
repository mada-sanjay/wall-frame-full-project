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
        const res = await fetch(`/api/sessions?user_email=${encodeURIComponent(email)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setDraftCount((data.sessions || []).length);
        }
      } catch {}
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
      background: isDarkMode ? "#1f2937" : "linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)", 
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <style>
        {`
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
        maxWidth: "1200px", 
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "40px"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h1 style={{ 
            fontSize: "48px", 
            fontWeight: "800", 
            color: isDarkMode ? "#f9fafb" : "#4c1d95", 
            marginBottom: "16px",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            Choose Your Plan
          </h1>
          <p style={{ 
            fontSize: "18px", 
            color: isDarkMode ? "#d1d5db" : "#6b21a8", 
            marginBottom: "32px",
            textShadow: "0 1px 2px rgba(0,0,0,0.1)"
          }}>
            Flexible pricing with upgrade request system and admin approval
          </p>
        </div>

        {/* Plans Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
          gap: "24px",
          marginBottom: "40px"
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