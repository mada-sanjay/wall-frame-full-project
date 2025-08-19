import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WallDesigner from "./WallDesigner";
import { getApiUrl } from "./config/config";

function SharedDraftLoader() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 SharedDraftLoader - Fetching draft with token:', token);
    const apiUrl = getApiUrl(`/shared/${token}`);
    console.log('🔍 SharedDraftLoader - API URL:', apiUrl);
    
    fetch(apiUrl)
      .then(res => {
        console.log('🔍 SharedDraftLoader - Response status:', res.status);
        console.log('🔍 SharedDraftLoader - Response ok:', res.ok);
        if (!res.ok) {
          return res.text().then(text => {
            console.log('🔍 SharedDraftLoader - Error response body:', text);
            throw new Error(`Draft not found (${res.status}): ${text}`);
          });
        }
        return res.json();
      })
      .then(data => {
        console.log('🔍 SharedDraftLoader - Success response data:', data);
        
        // The backend returns the draft data in the 'data' field, not 'session_data'
        let sessionData;
        if (data.data) {
          sessionData = typeof data.data === "string" ? JSON.parse(data.data) : data.data;
        } else if (data.session_data) {
          sessionData = typeof data.session_data === "string" ? JSON.parse(data.session_data) : data.session_data;
        } else {
          sessionData = data;
        }
        
        console.log('🔍 SharedDraftLoader - Parsed session data:', sessionData);
        setDraft(sessionData);
        setLoading(false);
      })
      .catch(err => {
        console.error('🔍 SharedDraftLoader - Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [token, navigate]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div>Loading shared design...</div>
      <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
        Token: {token}
      </div>
    </div>
  );
  
  if (error) return (
    <div style={{ textAlign: 'center', color: 'red', padding: 40 }}>
      <div>Error: {error}</div>
      <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
        Token: {token}
      </div>
    </div>
  );
  
  if (!draft) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div>Draft not found.</div>
      <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
        Token: {token}
      </div>
    </div>
  );

  // Add debugging info
  console.log('🎯 SharedDraftLoader - About to render WallDesigner with draft:', draft);

      return <WallDesigner initialDraft={draft} isSharedView={true} />;
}

export default SharedDraftLoader; 