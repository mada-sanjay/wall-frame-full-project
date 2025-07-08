import React, { useState } from "react";
import { Link } from "react-router-dom";

function RegisterPage() {
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    if (!regEmail.trim() || !regPassword.trim() || !regConfirm.trim()) {
      setRegError("Please fill all fields.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match.");
      return;
    }
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setRegSuccess("Registration successful!");
        setRegEmail("");
        setRegPassword("");
        setRegConfirm("");
      } else {
        setRegError(data.message || "Registration failed");
      }
    } catch (err) {
      setRegError("Network error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#f7f7fa" }}>
      <form onSubmit={handleRegister} style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", minWidth: 320 }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Register</h2>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Email"
            value={regEmail}
            onChange={e => setRegEmail(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Password"
            value={regPassword}
            onChange={e => setRegPassword(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Confirm Password"
            value={regConfirm}
            onChange={e => setRegConfirm(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc", fontSize: 16 }}
          />
        </div>
        {regError && <div style={{ color: "red", marginBottom: 12, textAlign: "center" }}>{regError}</div>}
        {regSuccess && <div style={{ color: "green", marginBottom: 12, textAlign: "center" }}>{regSuccess}</div>}
        <button type="submit" className="upload-btn" style={{ width: "100%", fontSize: 16, padding: "10px 0" }}>Register</button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </form>
    </div>
  );
}

export default RegisterPage; 