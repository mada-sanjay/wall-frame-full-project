import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import LandingPage from "./LandingPage";
import WallDesigner from "./WallDesigner";
import ProfilePage from "./ProfilePage";
import AdminPage from "./AdminPage";
import SharedDraftLoader from "./SharedDraftLoader";
import SharedDraftViewer from "./SharedDraftViewer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/walldesigner" element={<WallDesigner />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/shared/:token" element={<SharedDraftLoader />} />
        <Route path="/view/:token" element={<SharedDraftViewer />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
