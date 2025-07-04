import React from "react";

function LandingPage({ onStart }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1>Customize your wall</h1>
      <button style={{ marginTop: 20, padding: '12px 32px', fontSize: '1.2rem', cursor: 'pointer' }} onClick={onStart}>
        Start Design
      </button>
    </div>
  );
}

export default LandingPage; 