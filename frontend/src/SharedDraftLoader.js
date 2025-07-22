import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WallDesigner from "./WallDesigner";

function SharedDraftLoader() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userToken = localStorage.getItem("token");
    if (!userToken) {
      navigate(`/login?redirect=/shared/${token}`, { replace: true });
      return;
    }
    fetch(`/api/shared/${token}`)
      .then(res => {
        if (!res.ok) throw new Error("Draft not found");
        return res.json();
      })
      .then(data => {
        const sessionData = typeof data.session_data === "string" ? JSON.parse(data.session_data) : data.session_data;
        setDraft(sessionData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token, navigate]);

  // If not logged in, don't render anything (redirect will happen)
  if (!localStorage.getItem("token")) return null;

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', color: 'red', padding: 40 }}>{error}</div>;
  if (!draft) return <div style={{ textAlign: 'center', padding: 40 }}>Draft not found.</div>;

  return <WallDesigner initialDraft={draft} />;
}

export default SharedDraftLoader; 