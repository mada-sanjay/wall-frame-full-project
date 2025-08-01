import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import "./App.css";
import "./components/Wall.css";
import { useNavigate } from "react-router-dom";
import { getApiUrl, getAdminApiUrl } from "./config/config";
import config from "./config/config";

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
  const [plan, setPlan] = useState("basic");
  const [draftCount, setDraftCount] = useState(0);
  const [draftLimit, setDraftLimit] = useState(3);
  const [saveError, setSaveError] = useState("");
  // Add state for active tab
  const [activeTab, setActiveTab] = useState('design');

  useEffect(() => {
    // Fetch user plan first, then fetch decorations based on plan
    const token = localStorage.getItem("token");
          fetch(getApiUrl("/me"), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const userPlan = data.user?.plan || "basic";
        setPlan(userPlan);
        let limit = 3;
        if (userPlan === "pro") limit = 6;
        if (userPlan === "pro_max") limit = Infinity;
        setDraftLimit(limit);
        
        // Fetch decorations based on user's subscription plan
        return fetch(getAdminApiUrl(`/decorations/public/${userPlan}`));
      })
      .then(res => res.json())
      .then(data => {
        const dbDecorations = (data.decorations || []).map(d => ({ name: d.name, url: d.image }));
        const hardcoded = [
    { name: 'frame', url: '/frame_1.png' },
    { name: 'chair', url: '/chair.png' },
    { name: 'garland', url: '/garland-removebg-preview.png' },
    { name: 'garland', url: '/one.png' },
    { name: 'Image', url: '/two.png' },
    { name: 'garland', url: '/three.png' }, 
          { name: 'flower', url: '/flower-removebg-preview.png' },
        ];
        setDecorations([...dbDecorations, ...hardcoded]);
      })
      .catch(error => {
        console.error('Error fetching decorations:', error);
        // Fallback to basic decorations if plan-based fetch fails
        fetch(getAdminApiUrl('/decorations/public'))
          .then(res => res.json())
          .then(data => {
            const dbDecorations = (data.decorations || []).map(d => ({ name: d.name, url: d.image }));
            const hardcoded = [
      { name: 'frame', url: '/frame_1.png' },
      { name: 'chair', url: '/chair.png' },
      { name: 'garland', url: '/garland-removebg-preview.png' },
      { name: 'garland', url: '/one.png' },
      { name: 'Image', url: '/two.png' },
      { name: 'garland', url: '/three.png' }, 
            { name: 'flower', url: '/flower-removebg-preview.png' },
          ];
          setDecorations([...dbDecorations, ...hardcoded]);
        });
      });
    // Fetch plan and draft count from backend (already handled above)
    const user_email = localStorage.getItem("userEmail");
    if (user_email) {
      fetch(`/api/sessions?user_email=${encodeURIComponent(user_email)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setDraftCount((data.sessions || []).length));
    }
  }, []);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState('view');
  const [generatedLink, setGeneratedLink] = useState('');

  const navigate = useNavigate();

  // Redirect to /login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

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
    setSaveError("");
    const user_email = localStorage.getItem("userEmail");
    if (!user_email) {
      alert("You must be logged in to save a draft.");
      return;
    }
    if (draftLimit !== Infinity && draftCount >= draftLimit && !currentDraftId) {
      setSaveError(`Draft limit reached for your plan (${plan}). Upgrade your plan to save more drafts.`);
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
        res = await fetch(getApiUrl(`/update-session/${currentDraftId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ user_email, session_data })
        });
      } else {
        // Create new draft
        res = await fetch(getApiUrl("/save-session"), {
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
        // Update draft count after save
        setDraftCount(prev => prev + (currentDraftId ? 0 : 1));
      } else {
        setSaveError(data.message || "Failed to save draft.");
      }
    } catch (err) {
      setSaveError("Network error while saving draft.");
    }
  };

  const fetchDrafts = async () => {
    const user_email = localStorage.getItem("userEmail");
    if (!user_email) return;
    try {
      const res = await fetch(getApiUrl(`/sessions?user_email=${encodeURIComponent(user_email)}`), {
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
      const res = await fetch(getApiUrl(`/session/${sessionId}?user_email=${encodeURIComponent(user_email)}`), {
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
        // Update draft count after delete
        setDraftCount(prev => prev - 1);
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
      // Validate file size (max 5MB)
      const maxSize = config.upload.maxFileSize || 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
        return;
      }
      
      // Validate file type
      const allowedTypes = config.upload.allowedTypes || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }
      
      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file);
      setWallImage(blobUrl);
      
      // Optional: Upload to backend for persistence
      // uploadWallImageToBackend(file);
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
    <div className="wall-designer-root">
      {/* Top Header Bar */}
      <div className="header-bar">
        <div className="header-logo">
          <span role="img" aria-label="palette">🎨</span> Wall Designer <span className="pro-badge">Pro</span>
        </div>
        <div className="header-actions">
          <span className="user-email">{localStorage.getItem("userEmail") || "user@example.com"}</span>
          {localStorage.getItem('isAdmin') === '1' && (
            <button className="admin-dashboard" onClick={() => navigate('/admin')}><span style={{ marginRight: 6 }}>🛠️</span>Admin Dashboard</button>
          )}
          {/* Profile button: circular, icon only */}
          <button className="profile-btn" onClick={handleProfile}>
            <span>👤</span>
          </button>
          <button className="btn-logout" onClick={handleLogout}><span style={{ marginRight: 6 }}>⎋</span>Logout</button>
        </div>
      </div>
      {/* Replace the tabs div and the top control bar with a single flex row */}
      <div className="top-control-bar">
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '0 18px 0 8px' }}>
          <button className={`tab-btn${activeTab === 'design' ? ' active' : ''}`} onClick={() => setActiveTab('design')}><span style={{ marginRight: 6 }}>🎨</span>Design</button>
          <button className={`tab-btn${activeTab === 'decors' ? ' active' : ''}`} onClick={() => setActiveTab('decors')}><span style={{ marginRight: 6 }}>🖼️</span>Decors</button>
          <button className={`tab-btn${activeTab === 'drafts' ? ' active' : ''}`} onClick={() => setActiveTab('drafts')}><span style={{ marginRight: 6 }}>🗂️</span>Drafts</button>
        </div>
        <div className="divider-line" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, justifyContent: 'flex-start', marginLeft: 24 }}>
          <button className="action-btn reset-save-btn" onClick={handleNewDesign}>
            <span style={{ marginRight: 8, fontSize: 20, verticalAlign: 'middle' }}>↻</span> Reset View
          </button>
          <button className="action-btn reset-save-btn" onClick={handleSaveDraft}>
            <span style={{ marginRight: 8, fontSize: 20, verticalAlign: 'middle' }}>💾</span> {currentDraftId ? 'Update Draft' : 'Save Draft'}
          </button>
        </div>
        <div className="divider-line" />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingRight: 18 }}>
          <button className="action-btn share-btn" onClick={handleShare}>
            <span style={{ marginRight: 8, fontSize: 20, verticalAlign: 'middle' }}>🔗</span> Share
          </button>
          <button className="action-btn download-btn" onClick={handleDownload}>
            <span style={{ marginRight: 8, fontSize: 20, verticalAlign: 'middle' }}>⬇️</span> Download
          </button>
        </div>
      </div>
      <div className="wall-designer-layout">
        {/* Sidebar */}
        <div className="sidebar">
          {activeTab === 'design' && (
            <>
              <div className="section-card">
                <div className="section-title">Canvas Size</div>
                <div style={{ display: 'flex', gap: 6, maxWidth: 180, alignItems: 'flex-end' }}>
                  <div>
                    <label htmlFor="canvas-width">Width</label>
                    <input id="canvas-width" type="number" name="width" value={inputWidth} min={100} max={800} onChange={handleInputChange} />
                  </div>
    <div>
                    <label htmlFor="canvas-height">Height</label>
                    <input id="canvas-height" type="number" name="height" value={inputHeight} min={100} max={2000} onChange={handleInputChange} />
                  </div>
                  <button className="action-btn" style={{ minWidth: 60, padding: '8px 11px' }} onClick={handleSetWallSize}>Set</button>
                </div>
              </div>
              <div className="section-card">
                <div className="section-title">Default Wall Images</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxHeight: 100, overflowY: 'auto' }}>
                {defaultWallImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                      alt={`Default wall ${idx + 1}`}
                      className="default-wall-image"
                    draggable
                    onDragStart={handleDragStartDefaultImage(img)}
                      onClick={() => { setWallImage(img); }}
                  />
                ))}
                </div>
              </div>
              <div className="section-card">
                <div className="section-title">Upload Wall Background</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  Upload your own wall background image
                </div>
                <label className="upload-label upload-btn" style={{ 
                  display: 'block', 
                  marginBottom: 8,
                  background: '#4CAF50',
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleWallImageChange}
                    id="wall-background-upload"
                  />
                  📷 Upload Wall Background
                </label>
                {wallImage && wallImage.startsWith('blob:') && (
                  <div style={{ 
                    marginTop: 8, 
                    fontSize: 12, 
                    color: '#4CAF50',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ✅ Custom wall background uploaded
                  </div>
                )}
              </div>
              <div className="section-card">
                <div className="section-title">Add Images</div>
                <label className="upload-label upload-btn">
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagesUpload} />
                  Upload Image
                </label>
              </div>
            </>
          )}
          {activeTab === 'decors' && (
            <>
              <div className="section-card">
                <div className="section-title">My Decorations</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 120, overflowY: 'auto' }}>
                {decorations.map((item, idx) => (
                  <img
                    key={idx}
                    src={item.url}
                    alt={item.name}
                    title={item.name}
                    className="decoration-image"
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
          </div>
              <div className="section-card">
                <div className="section-title">Apply Frame</div>
                {selectedImageId ? (
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
                ) : <div style={{ color: '#888', fontSize: 14 }}>Select an image to apply a frame.</div>}
              </div>
            </>
          )}
          {activeTab === 'drafts' && (
            <div className="section-card">
              <div className="section-title">My Saved Drafts</div>
              {savedSessions.length === 0 ? (
                <div style={{ color: '#888', fontSize: 14 }}>No drafts saved yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 180, overflowY: 'auto' }}>
                  {savedSessions.map((session, idx) => (
                    <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < savedSessions.length - 1 ? '1px solid #eee' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>Draft {savedSessions.length - idx}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{new Date(session.created_at).toLocaleString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="action-btn" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => loadDraft(session)}>Load</button>
                        <button className="action-btn delete-btn" onClick={() => deleteDraft(session.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        {/* Main Canvas Area */}
        <div className="wall-main">
          {/* Button row above the canvas */}
          {/* Removed absolute positioning for buttons */}
          <div className="wall-canvas">
            {/* Canvas placeholder if empty */}
            {uploadedImages.length === 0 && decorationOverlays.length === 0 && !wallImage ? (
              <div className="canvas-placeholder">
                <span style={{ fontSize: 48, opacity: 0.3 }} role="img" aria-label="image">🖼️</span>
                <div style={{ fontWeight: 600, fontSize: 22, marginTop: 12 }}>Start Designing</div>
                <div style={{ color: '#888', fontSize: 16, marginTop: 6 }}>Upload images and start creating your wall design</div>
        </div>
            ) : (
            <div
              ref={wallRef}
              className={wallImage ? 'canvas-background-with-image' : 'canvas-background'}
              style={{
                position: 'relative',
                width: wallSize.width,
                height: wallSize.height,
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
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={dec.url}
                      alt={dec.name}
                      style={{
                        width: '100%',
                        height: '100%',
                          pointerEvents: 'auto',
                        userSelect: 'none',
                        display: 'block',
                        borderRadius: 6
                      }}
                    />
                  </div>
                </Rnd>
              ))}
            </div>
            )}
          </div>
        </div>
            </div>
      {showShareModal && (
          <div className="modal-overlay">
          <div className="share-modal">
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