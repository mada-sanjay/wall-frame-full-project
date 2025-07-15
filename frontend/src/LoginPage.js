import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/login", {
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
        }
        if (data && data.token) {
          localStorage.setItem("token", data.token);
        }
        console.log('Login successful, navigating to /walldesigner'); // Debug log
        navigate("/walldesigner");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#f7f7fa" }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", minWidth: 320 }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Login</h2>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
          />
        </div>
        {error && <div style={{ color: "red", marginBottom: 12, textAlign: "center" }}>{error}</div>}
        <button type="submit" className="upload-btn" style={{ width: "100%", fontSize: 16, padding: "10px 0" }}>Login</button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}

export default LoginPage; 