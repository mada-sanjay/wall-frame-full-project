import React, { useState } from "react";
import LoginPage from "./LoginPage";
import LandingPage from "./LandingPage";
import WallFrameHeader from "./WallFrameHeader";
import WallDesigner from "./WallDesigner";
import "./App.css";

function App() {
  const [page, setPage] = useState('landing');
  const [headingBg, setHeadingBg] = useState('#1976d2');
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div>
      {page === 'landing' ? (
        <LandingPage onStart={() => setPage('design')} />
      ) : (
        <>
          <WallFrameHeader headingBg={headingBg} onLogout={() => setLoggedIn(false)} />
          <WallDesigner headingBg={headingBg} setHeadingBg={setHeadingBg} />
        </>
      )}
    </div>
  );
}

export default App;
