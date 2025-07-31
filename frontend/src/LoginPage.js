import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        setError("Server error: Invalid response");
        return;
      }
      if (res.ok) {
        if (onLogin) onLogin();
        if (data && data.user && data.user.email) {
          localStorage.setItem("userEmail", data.user.email);
          localStorage.setItem("isAdmin", data.user.isAdmin ? "1" : "0");
        }
        if (data && data.token) {
          localStorage.setItem("token", data.token);
        }
        // Check for redirect param
        const params = new URLSearchParams(location.search);
        const redirect = params.get("redirect");
        if (redirect) {
          navigate(redirect, { replace: true });
        } else {
          navigate("/landing", { replace: true });
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error - Make sure backend is running on port 5000");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <div style={{
        background: "#fff",
        padding: 40,
        borderRadius: 18,
        boxShadow: "0 4px 32px rgba(25, 118, 210, 0.15)",
        minWidth: 340,
        maxWidth: 380,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }}>
        <h1 style={{
          textAlign: "center",
          marginBottom: 8,
          color: "#1976d2",
          fontWeight: 800,
          letterSpacing: 1
        }}>Welcome Back!</h1>
        <div style={{ color: '#555', fontSize: 16, marginBottom: 24, textAlign: 'center', fontWeight: 500 }}>
          Sign in to your <span style={{ color: '#1976d2', fontWeight: 700 }}>Wall Frame Designer</span> account
        </div>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ marginBottom: 18 }}>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #90caf9", fontSize: 16, outline: 'none', background: '#f7fafd', marginBottom: 4 }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #90caf9", fontSize: 16, outline: 'none', background: '#f7fafd', marginBottom: 4 }}
            />
          </div>
          {error && <div style={{ color: "#d32f2f", marginBottom: 14, textAlign: "center", fontWeight: 500 }}>{error}</div>}
          <button type="submit" style={{
            width: "100%",
            fontSize: 17,
            padding: "12px 0",
            background: "linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            letterSpacing: 1,
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)',
            cursor: 'pointer',
            marginBottom: 8
          }}>Sign In</button>
        </form>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 15 }}>
          Don't have an account? <Link to="/register" style={{ color: '#1976d2', fontWeight: 600, textDecoration: 'underline' }}>Register</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage; 