import React, { useState } from "react";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Dummy check: accept any non-empty email/password
    if (email.trim() && password.trim()) {
      onLogin();
    } else {
      setError('Please enter email and password.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f7f7fa' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', minWidth: 320 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Login</h2>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <button type="submit" className="upload-btn" style={{ width: '100%', fontSize: 16, padding: '10px 0' }}>Login</button>
      </form>
    </div>
  );
}

export default LoginPage; 