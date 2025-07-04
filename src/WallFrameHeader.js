import React from "react";

function WallFrameHeader({ headingBg, onLogout }) {
  return (
    <div style={{
      width: '100%',
      background: headingBg,
      borderBottom: '2px solid rgb(214, 223, 214)',
      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
      padding: '25px 0',
      marginBottom: 0,
      textAlign: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: 2,
      position: 'relative',
      borderRadius:'10px'
    }}>
      Wall Frame
      {/* Logout button on the right */}
      <button
        onClick={onLogout}
        style={{
          position: 'absolute',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'white',
          color: '#222',
          border: 'none',
          borderRadius: 6,
          padding: '8px 20px',
          fontWeight: 500,
          fontSize: 16,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default WallFrameHeader; 