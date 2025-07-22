import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import "./App.css";
import { useNavigate } from "react-router-dom";

// Helper to generate unique IDs
function generateId() {  
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Helper to get shape style
function getShapeStyle(shape) {
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%' };
    case 'diamond':
      return {
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        borderRadius: 0
      };
    case 'rhombus':
      return {
        clipPath: 'polygon(25% 50%, 50% 100%, 75% 50%, 50% 0%)',
        borderRadius: 0
      };
    case 'square':
    default:
      return { borderRadius: 8 };
  }
}

// Helper to get frame style
function getFrameStyle(frame, thickness = 4, color = '#333') {
  switch (frame) {
    case 'shadow':
      return { boxShadow: '0 4px 16px rgba(0,0,0,0.25)', border: 'none' };
    case 'gold':
      return { border: `${thickness}px solid gold` };
    case 'dashed':
      return { border: `${thickness}px dashed ${color}` };
    case 'dotted':
      return { border: `${thickness}px dotted ${color}` };
    case 'double':
      return { border: `${thickness}px double ${color}` };
    case 'gradient':
      return {
        border: `${thickness}px solid transparent`,
        borderImage: 'linear-gradient(45deg, #f3ec78, #af4261) 1',
      };
    case 'embossed':
      return {
        border: `${thickness}px solid ${color}`,
        boxShadow: '0 2px 8px #fff, 0 -2px 8px #aaa',
      };
    case 'wood':
      return { border: `${thickness}px solid #8B5C2A` };
    case 'none':
    default:
      return { border: 'none', boxShadow: 'none' };
  }
}

function WallDesigner({ headingBg, setHeadingBg, initialDraft }) {
  const [wallSize, setWallSize] = useState({ width: 500, height: 300 });
  const [prevWallSize, setPrevWallSize] = useState({ width: 500, height: 300 });
  const [wallImage, setWallImage] = useState(null);
  const [shape, setShape] = useState('square');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [inputWidth, setInputWidth] = useState(500);
  const [inputHeight, setInputHeight] = useState(300);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [showDefaultWallImages, setShowDefaultWallImages] = useState(false);
  const [showDecorations, setShowDecorations] = useState(false);
  const [decorationOverlays, setDecorationOverlays] = useState([]);
  const [savedSessions, setSavedSessions] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(null); // Track currently loaded draft
  const [shareToken, setShareToken] = useState(null);
  const wallRef = useRef(null);
  const defaultWallImages = [
    
    '/pexels-maksgelatin-4352247.jpg',
    '/wall1.jpeg',
    '/sanj.jpg',
    '/page.avif',
    '/raj.webp',
    
    
    
   
    
    
    // Add more local images here as needed
  ];
  const [decorations, setDecorations] = useState([]);

  useEffect(() => {
    fetch('/api/admin/decorations/public')
      .then(res => res.json())
      .then(data => {
        const dbDecorations = (data.decorations || []).map(d => ({ name: d.name, url: d.image }));
        const hardcoded = [
          { name: 'frame', url: '/frame_1.png' },
          { name: 'chair', url: '/chair.png' },
          { name: 'garland', url: '/garland-removebg-preview.png' },
          // { name: 'Image', url: '/garland_2.png' },
          { name: 'garland', url: '/one.png' },
          { name: 'Image', url: '/two.png' },
          { name: 'garland', url: '/three.png' },
          { name: 'flower', url: '/flower-removebg-preview.png' },
        ];
        setDecorations([...dbDecorations, ...hardcoded]);
      });
  }, []);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState('view');
  const [generatedLink, setGeneratedLink] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchDrafts();
  }, []);

  useEffect(() => {
    if (initialDraft) {
      if (initialDraft.wallSize) setWallSize(initialDraft.wallSize);
      if (initialDraft.wallImage !== undefined) setWallImage(initialDraft.wallImage);
      if (initialDraft.shape) setShape(initialDraft.shape);
      if (initialDraft.uploadedImages) setUploadedImages(initialDraft.uploadedImages);
      if (initialDraft.decorationOverlays) setDecorationOverlays(initialDraft.decorationOverlays);
      if (initialDraft.wallSize) {
        setInputWidth(initialDraft.wallSize.width);
        setInputHeight(initialDraft.wallSize.height);
      }
    }
  }, [initialDraft]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleNewDesign = () => {
    // Clear current state and start fresh
    setWallSize({ width: 500, height: 300 });
    setWallImage(null);
    setShape('square');
    setUploadedImages([]);
    setDecorationOverlays([]);
    setInputWidth(500);
    setInputHeight(300);
    setCurrentDraftId(null); // Clear current draft ID
    alert("Started new design!");
  };

  const handleSaveDraft = async () => {
    const user_email = localStorage.getItem("userEmail");
    if (!user_email) {
      alert("You must be logged in to save a draft.");
      return;
    }
    // Gather session state
    const session_data = {
      wallSize,
      wallImage,
      shape,
      uploadedImages,
      decorationOverlays,
      // Add more state as needed
    };
    
    try {
      let res;
      const token = localStorage.getItem('token');
      if (currentDraftId) {
        // Update existing draft
        res = await fetch(`/api/update-session/${currentDraftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ user_email, session_data })
        });
      } else {
        // Create new draft
        res = await fetch("/api/save-session", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ user_email, session_data })
        });
      }
      
      const data = await res.json();
      if (res.ok) {
        if (currentDraftId) {
          alert("Draft updated successfully!");
        } else {
          alert("Draft saved successfully!");
          // Set the current draft ID if it's a new draft
          if (data.sessionId) {
            setCurrentDraftId(data.sessionId);
          }
        }
        // Set share token if available
        if (data.share_token) setShareToken(data.share_token);
        // Refresh the drafts list
        fetchDrafts();
      } else {
        alert(data.message || "Failed to save draft.");
      }
    } catch (err) {
      alert("Network error while saving draft.");
    }
  };

  const fetchDrafts = async () => {
    const user_email = localStorage.getItem("userEmail");
    if (!user_email) return;
    try {
      const res = await fetch(`/api/sessions?user_email=${encodeURIComponent(user_email)}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSavedSessions(data.sessions);
      } else {
        console.error("Failed to fetch drafts:", data.message);
      }
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    }
  };

  const loadDraft = (session) => {
    try {
      const data = typeof session.session_data === 'string' ? JSON.parse(session.session_data) : session.session_data;
      
      if (data.wallSize) setWallSize(data.wallSize);
      if (data.wallImage !== undefined) setWallImage(data.wallImage);
      if (data.shape) setShape(data.shape);
      if (data.uploadedImages) setUploadedImages(data.uploadedImages);
      if (data.decorationOverlays) setDecorationOverlays(data.decorationOverlays);
      
      setCurrentDraftId(session.id);
      setShareToken(session.share_token || null); // <-- ensure shareToken is set when loading a draft
      setGeneratedLink(''); // Reset generatedLink when loading a draft
      
      setShowDrafts(false);
      alert("Draft loaded successfully!");
    } catch (err) {
      alert("Failed to load draft. Check console for details.");
    }
  };

  const deleteDraft = async (sessionId) => {
    const user_email = localStorage.getItem("userEmail");
    if (!user_email) {
      alert("You must be logged in to delete a draft.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this draft?")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/session/${sessionId}?user_email=${encodeURIComponent(user_email)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert("Draft deleted successfully!");
        // If we're deleting the currently loaded draft, clear the current draft ID
        if (currentDraftId === sessionId) {
          setCurrentDraftId(null);
        }
        // Refresh the drafts list
        fetchDrafts();
      } else {
        alert(data.message || "Failed to delete draft.");
      }
    } catch (err) {
      console.error("Network error while deleting draft:", err);
      alert("Network error while deleting draft.");
    }
  };

  // Handlers
  const handleWallImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWallImage(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'width') setInputWidth(Number(value));
    if (name === 'height') setInputHeight(Number(value));
  };

  const handleSetWallSize = () => {
    // Clamp width to 800
    const clampedWidth = Math.min(inputWidth, 800);
    const clampedHeight = inputHeight;
    // Calculate scale factors
    const scaleX = clampedWidth / wallSize.width;
    const scaleY = clampedHeight / wallSize.height;
    setUploadedImages((prev) =>
      prev.map(img => ({
        ...img,
        x: img.x * scaleX,
        y: img.y * scaleY,
        width: img.width * scaleX,
        height: img.height * scaleY,
      }))
    );
    setPrevWallSize({ width: wallSize.width, height: wallSize.height });
    setWallSize({ width: clampedWidth, height: clampedHeight });
    setInputWidth(clampedWidth); // update input field if user tried to set > 800
  };

  const handleShapeChange = (e) => {
    setShape(e.target.value);
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Process each file to convert to Base64
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target.result;
        const newImage = {
          id: generateId(),
          url: base64Data, // Store as Base64 instead of blob URL
          name: file.name,
          x: 20 + (uploadedImages.length + idx) * 30,
          y: 20 + (uploadedImages.length + idx) * 30,
          width: 100,
          height: 100,
          shape: shape,
          frame: 'none',
        };
        setUploadedImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file); // Convert to Base64
    });
  };

  // Update position/size of an image by id
  const updateImage = (id, data) => {
    setUploadedImages((prev) => {
      const updated = prev.map((img) => img.id === id ? { ...img, ...data } : img);
      return updated;
    });
  };

  // Delete an image by id
  const deleteImage = (id) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  // Drag-and-drop handlers for default images
  const handleDragStartDefaultImage = (imgUrl) => (e) => {
    e.dataTransfer.setData('default-image-url', imgUrl);
  };

  // Update handleWallDrop to support frames
  const handleWallDrop = (e) => {
    e.preventDefault();
    const imgUrl = e.dataTransfer.getData('default-image-url');
    if (imgUrl) {
      // Get drop position relative to wall
      const wallRect = wallRef.current.getBoundingClientRect();
      const dropX = e.clientX - wallRect.left;
      const dropY = e.clientY - wallRect.top;
      
      // Convert the default image URL to Base64 for persistence
      fetch(imgUrl)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Data = event.target.result;
            setUploadedImages(prev => [
              ...prev,
              {
                id: generateId(),
                url: base64Data, // Store as Base64 instead of direct URL
                name: 'Default Image',
                x: dropX - 50,
                y: dropY - 50,
                width: 100,
                height: 100,
                shape: shape,
                frame: 'none',
              }
            ]);
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error('Error converting default image to Base64:', error);
          // Fallback to original URL if conversion fails
          setUploadedImages(prev => [
            ...prev,
            {
              id: generateId(),
              url: imgUrl,
              name: 'Default Image',
              x: dropX - 50,
              y: dropY - 50,
              width: 100,
              height: 100,
              shape: shape,
              frame: 'none',
            }
          ]);
        });
    }
  };
  const handleWallDragOver = (e) => {
    e.preventDefault();
  };

  const handleDownload = async () => {
    if (!wallRef.current) return;
    const canvas = await html2canvas(wallRef.current, { backgroundColor: null });
    const link = document.createElement('a');
    link.download = 'wall-frame.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Share handler
  const handleShare = () => {
    if (!shareToken && !currentDraftId) {
      alert('Please save your draft first!');
      return;
    }
    setShowShareModal(true);
    setShareType('view');
    setGeneratedLink('');
  };
  const handleGenerateLink = () => {
    if (!shareToken) return;
    const url = shareType === 'view'
      ? `${window.location.origin}/view/${shareToken}`
      : `${window.location.origin}/shared/${shareToken}`;
    setGeneratedLink(url);
  };
  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setShowShareModal(false);
    }
  };
  const handleCopyShareLink = (type) => {
    if (!shareToken) return;
    const url = type === 'view'
      ? `${window.location.origin}/view/${shareToken}`
      : `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(url);
    alert(`${type === 'view' ? 'View-only' : 'Editable'} link copied to clipboard!\n\n${url}`);
    setShowShareModal(false);
  };

  return (
    <div>
      <div style={{
        width: '100%',
        background: '#1976d2',
        color: '#fff',
        padding: '24px 0',
        textAlign: 'center',
        fontSize: 32,
        fontWeight: 700,
        letterSpacing: 2,
        borderRadius: '0 0 16px 16px',
        marginBottom: 24,
        position: 'relative'
      }}>
        Design Your Wall
        {currentDraftId && (
          <div style={{
            position: 'absolute',
            left: 24,
            top: 24,
            background: '#fff',
            color: '#1976d2',
            padding: '4px 12px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600
          }}>
            Draft Loaded
          </div>
        )}
        <div style={{ position: 'absolute', right: 24, top: 24, display: 'flex', gap: 8 }}>
          {/* Admin Dashboard button, only for admins */}
          {localStorage.getItem('isAdmin') === '1' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                padding: "4px 10px",
                fontSize: 13,
                cursor: "pointer",
                background: "#fff",
                color: "#1976d2",
                border: "2px solid #1976d2",
                borderRadius: 4,
                fontWeight: 600,
                marginRight: 8
              }}
            >
              Admin Dashboard
            </button>
          )}
          <button
            onClick={handleNewDesign}
            style={{
              padding: "4px 10px",
              fontSize: 13,
              cursor: "pointer",
              background: "#fff",
              color: "#1976d2",
              border: "none",
              borderRadius: 4,
              fontWeight: 600
            }}
          >
            New Design
          </button>
          <button
            onClick={handleSaveDraft}
            style={{
              padding: "4px 10px",
              fontSize: 13,
              cursor: "pointer",
              background: "#fff",
              color: "#1976d2",
              border: "none",
              borderRadius: 4,
              fontWeight: 600
            }}
          >
            {currentDraftId ? "Update Draft" : "Save Draft"}
          </button>
          <button
            onClick={() => {
              fetchDrafts();
              setShowDrafts(!showDrafts);
            }}
            style={{
              padding: "4px 10px",
              fontSize: 13,
              cursor: "pointer",
              background: "#fff",
              color: "#1976d2",
              border: "none",
              borderRadius: 4,
              fontWeight: 600
            }}
          >
            My Drafts
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "4px 10px",
              fontSize: 13,
              cursor: "pointer",
              background: "#fff",
              color: "#1976d2",
              border: "none",
              borderRadius: 4,
              fontWeight: 600
            }}
          >
            Logout
          </button>
          <button
            onClick={handleProfile}
            style={{
              width: 32,
              height: 32,
              padding: 0,
              fontSize: 18,
              cursor: "pointer",
              background: "#fff",
              color: "#1976d2",
              border: "none",
              borderRadius: "50%",
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Profile"
          >
            {/* Use a user icon if you have one, otherwise fallback to 'P' */}
            <span role="img" aria-label="profile">👤</span>
          </button>
        </div>
      </div>
      {/* Drafts Dropdown */}
      {showDrafts && (
        <div style={{
          position: 'absolute',
          top: 80,
          right: 24,
          background: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          padding: 16,
          minWidth: 300,
          maxHeight: 400,
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>My Saved Drafts</div>
          {savedSessions.length === 0 ? (
            <div style={{ color: '#888', fontSize: 14 }}>No drafts saved yet.</div>
          ) : (
            savedSessions.map((session, idx) => (
              <div key={session.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: idx < savedSessions.length - 1 ? '1px solid #eee' : 'none'
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Draft {savedSessions.length - idx}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {new Date(session.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => loadDraft(session)}
                    style={{
                      padding: '4px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                      background: '#1976d2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 500
                    }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteDraft(session.id)}
                    style={{
                      padding: '4px 12px',
                      fontSize: 12,
                      cursor: 'pointer',
                      background: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 500
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {/* Layout: Left sidebar, Wall container, Right controls */}
      <div style={{
        marginTop: 12,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 32
      }}>
        {/* Left Sidebar */}
        <div style={{
          minWidth: 180,
          background: '#f7f7fa',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          marginRight: 8
        }}>
          {/* Default Wall Images Section */}
          <div style={{ width: '100%', marginBottom: 24, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 10, border: '1px solid #e0e0e0' }}>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Default Wall Images</div>
            <button
              style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, border: '1px solid #bbb', background: '#f7f7fa', cursor: 'pointer', width: '100%' }}
              onClick={() => setShowDefaultWallImages((v) => !v)}
            >
              {showDefaultWallImages ? 'Hide Images' : 'Give me some default images'}
            </button>
            {showDefaultWallImages && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {defaultWallImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Default wall ${idx+1}`}
                    style={{ width: 140, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'grab', border: '2px solid #eee' }}
                    draggable
                    onDragStart={handleDragStartDefaultImage(img)}
                    onClick={() => { setWallImage(img); setShowDefaultWallImages(false); }}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Decorations Container */}
          <div style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 10, border: '1px solid #e0e0e0', marginTop: 0, marginBottom: 24 }}>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Decorations</div>
            <button
              style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 6, border: '1px solid #bbb', background: '#f7f7fa', cursor: 'pointer', width: '100%' }}
              onClick={() => setShowDecorations(v => !v)}
            >
              {showDecorations ? 'Hide Decorations' : 'Show Decorations'}
            </button>
            {showDecorations && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                {decorations.map((item, idx) => (
                  <img
                    key={idx}
                    src={item.url}
                    alt={item.name}
                    title={item.name}
                    style={{ width: 80, height: 60, objectFit: 'contain', borderRadius: 6, cursor: 'pointer', margin: '0 auto' }}
                    onClick={() => {
                      setDecorationOverlays(prev => [
                        ...prev,
                        {
                          url: item.url,
                          name: item.name,
                          x: 20 + prev.length * 30,
                          y: 20 + prev.length * 30,
                          width: 80,
                          height: 60
                        }
                      ]);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div style={{
            minWidth: 180,
            background: '#f7f7f7',
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            padding: 16,
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'stretch',
          }}>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Selected Decorations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {decorationOverlays.length === 0 && (
                <span style={{ color: '#888', fontSize: 14 }}>No decorations added.</span>
              )}
              {decorationOverlays.map((dec, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={dec.url}
                    alt={dec.name}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }}
                  />
                  <button
                    className="delete-btn"
                    onClick={() => setDecorationOverlays(prev => prev.filter((_, i) => i !== idx))}
                    title="Delete"
                    style={{
                      background: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#d32f2f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Wall Container + Download Button as a column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            background: '#fff',
            border: '2px solid #e0e0e0',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            padding: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: wallSize.height + 48,
            minWidth: wallSize.width + 48,
            backgroundColor:'lightblue',
            position: 'relative'
          }}>
            <div
              ref={wallRef}
              style={{
                position: 'relative',
                width: wallSize.width,
                height: wallSize.height,
                background: wallImage ? '#fff' : '#f0f4fa',
                borderRadius: 8,
                border: wallImage ? 'none' : '2px dashed #b0b0b0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
              onDrop={handleWallDrop}
              onDragOver={handleWallDragOver}
            >
              {/* Always render wall image as first absolutely positioned child */}
              {wallImage && (
                <img
                  src={wallImage}
                  alt="Wall Preview"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 8,
                    zIndex: 0,
                  }}
                />
              )}
              {/* Overlay uploaded images on the wall, draggable and resizable */}
              {uploadedImages.map((img) => (
                <Rnd
                  key={img.id}
                  size={{ width: img.width, height: img.height }}
                  position={{ x: img.x, y: img.y }}
                  bounds="parent"
                  onDrag={(e, d) => updateImage(img.id, { x: d.x, y: d.y })}
                  onDragStop={(e, d) => updateImage(img.id, { x: d.x, y: d.y })}
                  onResize={(e, direction, ref, delta, position) => {
                    updateImage(img.id, {
                      width: parseInt(ref.style.width, 10),
                      height: parseInt(ref.style.height, 10),
                      ...position
                    });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    updateImage(img.id, {
                      width: parseInt(ref.style.width, 10),
                      height: parseInt(ref.style.height, 10),
                      ...position
                    });
                  }}
                  style={{ zIndex: 2 }}
                >
                  <div className="image-frame" style={{ position: 'relative', width: '100%', height: '100%', ...getFrameStyle(img.frame), ...getShapeStyle(img.shape) }}>
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        pointerEvents: 'auto',
                        background: '#fff',
                        ...getShapeStyle(img.shape),
                      }}
                      onClick={() => setSelectedImageId(img.id)}
                    />
                  </div>
                </Rnd>
              ))}
              {/* Decoration overlays (ensure these are inside wallRef for download) */}
              {decorationOverlays.map((dec, idx) => (
                <Rnd
                  key={idx}
                  size={{ width: dec.width, height: dec.height }}
                  position={{ x: dec.x, y: dec.y }}
                  bounds="parent"
                  minWidth={30}
                  minHeight={30}
                  maxWidth={wallSize.width}
                  maxHeight={wallSize.height}
                  onDrag={(e, d) => setDecorationOverlays(prev => prev.map((o, i) => i === idx ? { ...o, x: d.x, y: d.y } : o))}
                  onDragStop={(e, d) => setDecorationOverlays(prev => prev.map((o, i) => i === idx ? { ...o, x: d.x, y: d.y } : o))}
                  onResize={(e, direction, ref, delta, position) => {
                    setDecorationOverlays(prev => prev.map((o, i) => i === idx ? {
                      ...o,
                      width: parseInt(ref.style.width, 10),
                      height: parseInt(ref.style.height, 10),
                      ...position
                    } : o));
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    setDecorationOverlays(prev => prev.map((o, i) => i === idx ? {
                      ...o,
                      width: parseInt(ref.style.width, 10),
                      height: parseInt(ref.style.height, 10),
                      ...position
                    } : o));
                  }}
                  style={{ zIndex: 15, pointerEvents: 'auto', position: 'absolute' }}
                  enableResizing={true}
                >
                  <div
                    style={{ position: 'relative', width: '100%', height: '100%' }}
                  >
                    <img
                      src={dec.url}
                      alt={dec.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'auto', // <-- changed from 'none' to 'auto'
                        userSelect: 'none',
                        display: 'block',
                        borderRadius: 6
                      }}
                    />
                  </div>
                </Rnd>
              ))}
            </div>
          </div>
          {/* Download Button below wall, centered with wall */}
          <button className="upload-btn" style={{ fontSize: 16, padding: '10px 32px', marginTop: 24 }} onClick={handleDownload}>
            Download
          </button>
          <button className="upload-btn" style={{ fontSize: 16, padding: '10px 32px', marginTop: 12 }} onClick={handleShare}>
            Share
          </button>
        </div>
        {/* Right Side Controls: Two separate containers stacked vertically */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* First container: Upload Wall & wall size */}
          <div style={{
            minWidth: 240,
            background: '#f7f7f7',
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'stretch',
            width:'20px'
          }}>
            {/* Upload Wall */}
            <label className="upload-label upload-btn" style={{ justifyContent: 'center' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleWallImageChange} />
              Upload Wall
            </label>
            {/* Debug: Show wall image file name or message */}
            <span style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>
              {wallImage ? 'Wall image selected' : 'No wall image selected'}
            </span>
            {/* Wall Size Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span>Width:</span>
              <input
                type="number"
                name="width"
                value={inputWidth}
                min={100}
                max={800}
                onChange={handleInputChange}
                style={{ width: 40, padding: '2px 4px', fontSize: 14 }}
              />
              <span>Height:</span>
              <input
                type="number"
                name="height"
                value={inputHeight}
                min={100}
                max={2000}
                onChange={handleInputChange}
                style={{ width: 40, padding: '2px 4px', fontSize: 14 }}
              />
              <button className="upload-btn" style={{ padding: '6px 16px', fontSize: 14 }} onClick={handleSetWallSize}>Set</button>
            </div>
          </div>
          {/* Second container: Choose Shape & Upload Images */}
          <div style={{
            minWidth: 240,
            background: '#f7f7f7',
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'stretch',
            width:'20px'
          }}>
            {/* Shape Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <span style={{ fontSize: 14 }}>Shape:</span>
              <select value={shape} onChange={handleShapeChange} style={{ padding: 4 }}>
                <option value="circle">Circle</option>
                <option value="diamond">Diamond</option>
                <option value="square">Square</option>
                <option value="rhombus">Rhombus</option>
              </select>
            </div>
            {/* Upload Images */}
            <label className="upload-label upload-btn" style={{ justifyContent: 'center' }}>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagesUpload} />
              ⬆️ Upload Images
            </label>
          </div>
          {/* Third container: Frame Selector for Uploaded Images */}
          <div style={{
            minWidth: 240,
            background: '#f7f7f7',
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'stretch',
          }}>
            {selectedImageId ? (
              <>
                <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Apply Frame</div>
                <select
                  aria-label="Apply Frame"
                  value={uploadedImages.find(img => img.id === selectedImageId)?.frame || 'none'}
                  onChange={e => {
                    const frame = e.target.value;
                    updateImage(selectedImageId, { frame });
                  }}
                  style={{ padding: 6, fontSize: 15, borderRadius: 6, border: '1px solid #bbb', marginBottom: 8 }}
                >
                  <option value="none">Apply Frame</option>
                  <option value="shadow">Shadow</option>
                  <option value="gold">Gold</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                  <option value="gradient">Gradient</option>
                  <option value="embossed">Embossed</option>
                  <option value="wood">Wood</option>
                </select>
              </>
            ) : null}
          </div>
          {/* Add this after the Frame selector container in the right-side controls */}
          <div style={{
            minWidth: 240,
            background: '#f7f7f7',
            border: '1px solid #e0e0e0',
            borderRadius: 12,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'stretch',
            marginTop: 8
          }}>
            <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 8 }}>Selected Images</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {uploadedImages.length === 0 && (
                <span style={{ color: '#888', fontSize: 14 }}>No images uploaded.</span>
              )}
              {uploadedImages.map(img => (
                <div key={img.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img
                    src={img.url}
                    alt={img.name}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc' }}
                  />
                  <button
                    className="delete-btn"
                    onClick={() => deleteImage(img.id)}
                    title="Delete"
                    style={{
                      background: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#d32f2f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showShareModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <h3 style={{ marginBottom: 16 }}>Share this draft</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, width: '100%' }}>
              <label style={{ fontWeight: 500, fontSize: 15 }}>
                <input type="radio" name="shareType" value="view" checked={shareType === 'view'} onChange={() => setShareType('view')} /> View Only
              </label>
              <label style={{ fontWeight: 500, fontSize: 15 }}>
                <input type="radio" name="shareType" value="edit" checked={shareType === 'edit'} onChange={() => setShareType('edit')} /> Editable
              </label>
            </div>
            <button onClick={handleGenerateLink} style={{ padding: '8px 20px', borderRadius: 6, border: '1px solid #1976d2', background: '#1976d2', color: '#fff', fontWeight: 600, fontSize: 15, margin: '16px 0 0 0' }}>Generate Link</button>
            {generatedLink && (
              <div style={{ marginTop: 16, width: '100%', textAlign: 'center' }}>
                <div style={{ wordBreak: 'break-all', color: '#1976d2', fontSize: 14, marginBottom: 8 }}>{generatedLink}</div>
                <button onClick={handleCopyLink} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#e3f0fc', color: '#1976d2', fontWeight: 600, fontSize: 14 }}>Copy Link</button>
              </div>
            )}
            <button onClick={() => setShowShareModal(false)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#eee', color: '#333', fontWeight: 500, fontSize: 14, marginTop: 12 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WallDesigner; 