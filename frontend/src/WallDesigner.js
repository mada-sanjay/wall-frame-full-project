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

function WallDesigner({ headingBg, setHeadingBg, initialDraft, isSharedView = false }) {
  const navigate = useNavigate();
  
  const APP_VERSION = 'v2.1.0';

  useEffect(() => {
    console.log('🚀 WallDesigner App Version:', APP_VERSION);
    console.log('🕐 Loaded at:', new Date().toISOString());
    console.log('🎯 WallDesigner mode - isSharedView:', isSharedView);
    console.log('🎯 WallDesigner initialDraft:', initialDraft);
    localStorage.setItem('wallDesignerVersion', APP_VERSION);
  }, []);
  
  // Authentication check (skip for shared views)
  useEffect(() => {
    if (isSharedView) {
      console.log('🔍 WallDesigner - Shared view mode, skipping authentication');
      return;
    }
    
    const token = localStorage.getItem('token');
    console.log('🔍 WallDesigner - Token check:', !!token);
    
    if (!token) {
      console.log('❌ No token found, redirecting to login');
      navigate('/login');
      return;
    }
    
    // Simple token check - just verify it exists and has a valid format
    // Don't make an API call that could fail and cause login loops
    if (token && token.length > 10) {
      console.log('✅ Token exists and looks valid, proceeding to designer');
    } else {
      console.log('❌ Invalid token format, redirecting to login');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate, isSharedView]);

  const [wallSize, setWallSize] = useState({ width: 500, height: 300 });
  const [prevWallSize, setPrevWallSize] = useState({ width: 500, height: 300 });
  const [wallImage, setWallImage] = useState(null);
  const [shape, setShape] = useState('square');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [inputWidth, setInputWidth] = useState(500);
  const [inputHeight, setInputHeight] = useState(300);
  const [selectedImageId, setSelectedImageId] = useState(null);
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
    // Skip user-specific data fetching for shared views
    if (isSharedView) {
      console.log('🔍 Shared view mode - using basic plan and public decorations');
      setPlan("basic");
      setDraftLimit(3);
      
      // Fetch basic decorations for shared view
      fetch(getApiUrl('/decorations/public/basic'))
        .then(res => res.json())
        .then(data => {
          console.log('📦 Basic decorations data received:', data);
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
          const allDecorations = [...dbDecorations, ...hardcoded];
          setDecorations(allDecorations);
        })
        .catch(error => {
          console.error('❌ Error fetching basic decorations:', error);
          const hardcoded = [
            { name: 'frame', url: '/frame_1.png' },
            { name: 'chair', url: '/chair.png' },
            { name: 'garland', url: '/garland-removebg-preview.png' },
            { name: 'garland', url: '/one.png' },
            { name: 'Image', url: '/two.png' },
            { name: 'garland', url: '/three.png' },
            { name: 'flower', url: '/flower-removebg-preview.png' },
          ];
          setDecorations(hardcoded);
        });
      return;
    }
    
    // Fetch user plan first, then fetch decorations based on plan
    const token = localStorage.getItem("token");
    console.log('🔍 Fetching user plan and decorations...');

    fetch(getApiUrl("/me"), { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        const userPlan = data.user?.plan || "basic";
        console.log('👤 User plan:', userPlan);
        setPlan(userPlan);
        let limit = 3;
        if (userPlan === "pro") limit = 6;
        if (userPlan === "pro_max") limit = Infinity;
        setDraftLimit(limit);

        // Fetch decorations based on user's subscription plan
        console.log('🎨 Fetching decorations for plan:', userPlan);
        return fetch(getApiUrl(`/decorations/public/${userPlan}`));
      })
      .then(res => {
        console.log('📡 Decorations API response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📦 Decorations data received:', data);
        const dbDecorations = (data.decorations || []).map(d => ({ name: d.name, url: d.image }));
        console.log('🖼️ Database decorations:', dbDecorations);

        // Always show these default decorations
        const hardcoded = [
          { name: 'frame', url: '/frame_1.png' },
          { name: 'chair', url: '/chair.png' },
          { name: 'garland', url: '/garland-removebg-preview.png' },
          { name: 'garland', url: '/one.png' },
          { name: 'Image', url: '/two.png' },
          { name: 'garland', url: '/three.png' },
          { name: 'flower', url: '/flower-removebg-preview.png' },
        ];
        console.log('🖼️ Hardcoded decorations:', hardcoded);

        // Merge and deduplicate by image URL
        const allDecorations = [...dbDecorations, ...hardcoded].filter((item, idx, arr) =>
          arr.findIndex(d => d.url === item.url) === idx
        );
        console.log('🎯 Total decorations to set (with defaults always present):', allDecorations.length);
        setDecorations(allDecorations);
      })
      .catch(error => {
        console.error('❌ Error fetching decorations:', error);
        // Fallback to basic decorations if plan-based fetch fails
        console.log('🔄 Trying fallback decorations...');
        fetch(getApiUrl('/decorations/public/basic'))
          .then(res => res.json())
          .then(data => {
            console.log('📦 Fallback decorations data:', data);
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
            const allDecorations = [...dbDecorations, ...hardcoded];
            console.log('🎯 Fallback total decorations:', allDecorations.length);
            setDecorations(allDecorations);
          })
          .catch(fallbackError => {
            console.error('❌ Fallback also failed:', fallbackError);
            // Set at least hardcoded decorations
            const hardcoded = [
              { name: 'frame', url: '/frame_1.png' },
              { name: 'chair', url: '/chair.png' },
              { name: 'garland', url: '/garland-removebg-preview.png' },
              { name: 'garland', url: '/one.png' },
              { name: 'Image', url: '/two.png' },
              { name: 'garland', url: '/three.png' },
              { name: 'flower', url: '/flower-removebg-preview.png' },
            ];
            console.log('🛡️ Setting hardcoded decorations only:', hardcoded.length);
            setDecorations(hardcoded);
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
  }, [isSharedView]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState('view');
  const [generatedLink, setGeneratedLink] = useState('');
  
  // Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('png');
  const [exportQuality, setExportQuality] = useState('high');
  const [exportResolution, setExportResolution] = useState('720p'); // Default to lowest resolution
  const [isExporting, setIsExporting] = useState(false);

  // Reset export resolution based on plan restrictions
  useEffect(() => {
    const allowedResolutions = {
      'basic': ['720p'],
      'pro': ['720p', '1080p'], 
      'pro_max': ['720p', '1080p', '4k']
    };
    
    const allowed = allowedResolutions[plan] || ['720p'];
    if (!allowed.includes(exportResolution)) {
      // Reset to the highest available resolution for the plan
      setExportResolution(allowed[allowed.length - 1]);
    }
  }, [plan, exportResolution]);

  // Delete a decoration overlay by index
  const deleteDecorationOverlay = (overlayIndex) => {
    setDecorationOverlays(prev => prev.filter((_, i) => i !== overlayIndex));
  };

  // Redirect to /login if not authenticated (skip for shared views)
  useEffect(() => {
    if (isSharedView) return;
    
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate, isSharedView]);

  useEffect(() => {
    if (!isSharedView) {
      fetchDrafts();
    }
  }, [isSharedView]);

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
    const token = localStorage.getItem('token');
    
    console.log('Save draft attempt:', { user_email, hasToken: !!token, currentDraftId });
    
    if (!user_email) {
      setSaveError("You must be logged in to save a draft.");
      return;
    }
    
    if (!token) {
      setSaveError("Authentication token missing. Please log in again.");
      return;
    }
    
    if (draftLimit !== Infinity && draftCount >= draftLimit && !currentDraftId) {
      setSaveError(`Draft limit reached for your plan (${plan}). Upgrade your plan to save more drafts.`);
      return;
    }
    
    // Ask for draft name if it's a new draft
    let draftName = '';
    if (!currentDraftId) {
      draftName = prompt("Enter a name for your draft:");
      if (!draftName || draftName.trim() === '') {
        setSaveError("Draft name is required.");
        return;
      }
      if (draftName.length > 50) {
        setSaveError("Draft name must be 50 characters or less.");
        return;
      }
    }
    
    // Gather session state
    const session_data = {
      wallSize,
      wallImage,
      shape,
      uploadedImages,
      decorationOverlays,
      draftName: draftName || 'Untitled Draft',
      // Add more state as needed
    };
    
    console.log('Session data to save:', session_data);
    
    try {
      let res;
      const url = currentDraftId ? getApiUrl(`/update-session/${currentDraftId}`) : getApiUrl("/save-session");
      const method = currentDraftId ? "PUT" : "POST";
      
      console.log('Making request to:', url, 'Method:', method);
      
      res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ user_email, session_data })
      });
      
      console.log('Response status:', res.status);
      
      // Handle different error statuses
      if (res.status === 500) {
        console.error('Server error (500):', res.statusText);
        setSaveError("Server error. Please try again or contact support.");
        return;
      }
      
      if (res.status === 401) {
        console.error('Unauthorized (401) - token may be expired');
        setSaveError("Your session has expired. Please log in again.");
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      
      const data = await res.json();
      console.log('Response data:', data);
      
      if (res.ok) {
        if (currentDraftId) {
          alert("Draft updated successfully!");
        } else {
          alert(`Draft "${draftName}" saved successfully!`);
          // Set the current draft ID if it's a new draft
          if (data.sessionId) {
            setCurrentDraftId(data.sessionId);
          }
        }
        // Set share token if available
        if (data.share_token) {
          console.log('🔑 Received share token from server:', data.share_token);
          setShareToken(data.share_token);
        } else {
          console.log('⚠️ No share token received from server');
        }
        // Refresh the drafts list
        fetchDrafts();
        // Update draft count after save
        setDraftCount(prev => prev + (currentDraftId ? 0 : 1));
      } else {
        console.error('Save draft failed:', data);
        setSaveError(data.message || `Failed to save draft. Status: ${res.status}`);
      }
    } catch (err) {
      console.error('Network error saving draft:', err);
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setSaveError("Cannot connect to server. Please check your internet connection.");
      } else {
        setSaveError(`Network error while saving draft: ${err.message}`);
      }
    }
  };

  const fetchDrafts = async () => {
    const user_email = localStorage.getItem("userEmail");
    console.log('🔍 fetchDrafts called with user_email:', user_email, 'isSharedView:', isSharedView);
    if (!user_email) {
      console.log('❌ No user_email found in localStorage');
      return;
    }
    if (isSharedView) {
      console.log('🔍 Skipping fetchDrafts in shared view mode');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Making request to fetch drafts with token:', !!token);
      const res = await fetch(getApiUrl(`/sessions?user_email=${encodeURIComponent(user_email)}`), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      console.log('🔍 Response status:', res.status);
      const data = await res.json();
      console.log('🔍 Response data:', data);
      if (res.ok) {
        console.log('✅ Drafts fetched successfully:', data.sessions?.length || 0, 'drafts');
        setSavedSessions(data.sessions);
      } else {
        console.error("❌ Failed to fetch drafts:", data.message);
      }
    } catch (err) {
      console.error("❌ Network error while fetching drafts:", err);
    }
  };

  const loadDraft = (session) => {
    try {
      console.log('📥 Loading draft:', session);
      console.log('🔑 Session share token:', session.share_token);
      
      const data = typeof session.session_data === 'string' ? JSON.parse(session.session_data) : session.session_data;
      
      if (data.wallSize) setWallSize(data.wallSize);
      if (data.wallImage !== undefined) setWallImage(data.wallImage);
      if (data.shape) setShape(data.shape);
      if (data.uploadedImages) setUploadedImages(data.uploadedImages);
      if (data.decorationOverlays) setDecorationOverlays(data.decorationOverlays);
      
      setCurrentDraftId(session.id);
      setShareToken(session.share_token || null); // <-- ensure shareToken is set when loading a draft
      setGeneratedLink(''); // Reset generatedLink when loading a draft
      
      console.log('✅ Draft loaded successfully');
      console.log('🆔 Set current draft ID:', session.id);
      console.log('🔑 Set share token:', session.share_token);
      
      setShowDrafts(false);
      alert("Draft loaded successfully!");
    } catch (err) {
      console.error('❌ Error loading draft:', err);
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

  // Enhanced export function with multiple formats and quality options
  const handleExport = async () => {
    if (!wallRef.current) return;
    
    setIsExporting(true);
    
    try {
      // Get resolution settings
      const resolutions = {
        '720p': { width: 1280, height: 720, scale: 1 },
        '1080p': { width: 1920, height: 1080, scale: 1.5 },
        '4k': { width: 3840, height: 2160, scale: 3 }
      };
      
      const resolution = resolutions[exportResolution];
      
      // Configure html2canvas options based on quality
      const html2canvasOptions = {
        backgroundColor: null,
        scale: resolution.scale,
        useCORS: true,
        allowTaint: true,
        width: wallSize.width,
        height: wallSize.height,
        logging: false
      };
      
      // Adjust quality based on setting
      if (exportQuality === 'high') {
        html2canvasOptions.scale = Math.max(resolution.scale, 2);
      } else if (exportQuality === 'medium') {
        html2canvasOptions.scale = Math.max(resolution.scale * 0.7, 1);
      } else if (exportQuality === 'low') {
        html2canvasOptions.scale = 1;
      }
      
      const canvas = await html2canvas(wallRef.current, html2canvasOptions);
      
      // Handle different export formats
      let dataUrl, fileName, mimeType;
      
      switch (exportFormat) {
        case 'png':
          dataUrl = canvas.toDataURL('image/png');
          fileName = `wall-design-${exportResolution}-${exportQuality}.png`;
          mimeType = 'image/png';
          break;
          
        case 'jpeg':
          // JPEG quality based on setting
          const jpegQuality = exportQuality === 'high' ? 0.95 : exportQuality === 'medium' ? 0.8 : 0.6;
          dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
          fileName = `wall-design-${exportResolution}-${exportQuality}.jpg`;
          mimeType = 'image/jpeg';
          break;
          
        case 'webp':
          const webpQuality = exportQuality === 'high' ? 0.95 : exportQuality === 'medium' ? 0.8 : 0.6;
          dataUrl = canvas.toDataURL('image/webp', webpQuality);
          fileName = `wall-design-${exportResolution}-${exportQuality}.webp`;
          mimeType = 'image/webp';
          break;
          
        default:
          dataUrl = canvas.toDataURL('image/png');
          fileName = `wall-design-${exportResolution}-${exportQuality}.png`;
          mimeType = 'image/png';
      }
      
      // Create download link
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      
      // Show success message
      setTimeout(() => {
        alert(`✅ Design exported successfully as ${fileName}`);
      }, 100);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };
  


  // Legacy function for backward compatibility
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
    console.log('🔗 Share button clicked');
    console.log('🔑 Current share token:', shareToken);
    console.log('🆔 Current draft ID:', currentDraftId);
    
    if (!currentDraftId) {
      alert('Please save your draft first!');
      return;
    }
    
    // If no share token but we have a draft ID, we can still proceed
    // The share token should be generated when the draft was saved
    setShowShareModal(true);
    setShareType('view');
    setGeneratedLink('');
  };

  const handleGenerateLink = () => {
    console.log('🔗 Generate link clicked');
    console.log('🔑 Share token:', shareToken);
    console.log('🆔 Current draft ID:', currentDraftId);
    console.log('📋 Share type:', shareType);
    
    if (!shareToken && !currentDraftId) {
      console.log('❌ No share token or draft ID available');
      alert('No share token available. Please save your draft first.');
      return;
    }
    
    // Use share token if available, otherwise use draft ID as fallback
    const identifier = shareToken || currentDraftId;
    const url = shareType === 'view'
      ? `${window.location.origin}/view/${identifier}`
      : `${window.location.origin}/shared/${identifier}`;
    
    console.log('🔗 Generated URL:', url);
    setGeneratedLink(url);
  };
  const handleCopyLink = () => {
    if (generatedLink) {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(generatedLink)
          .then(() => {
            alert('Link copied to clipboard!');
            setShowShareModal(false);
          })
          .catch(err => {
            console.error('Clipboard API failed:', err);
            // Fallback: use document.execCommand
            fallbackCopyToClipboard(generatedLink);
          });
      } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(generatedLink);
      }
    }
  };

  const handleCopyShareLink = (type) => {
    const identifier = shareToken || currentDraftId;
    if (!identifier) return;
    
    const url = type === 'view'
      ? `${window.location.origin}/view/${identifier}`
      : `${window.location.origin}/shared/${identifier}`;
    
    // Check if clipboard API is available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          alert(`${type === 'view' ? 'View-only' : 'Editable'} link copied to clipboard!\n\n${url}`);
          setShowShareModal(false);
        })
        .catch(err => {
          console.error('Clipboard API failed:', err);
          // Fallback: use document.execCommand
          fallbackCopyToClipboard(url);
        });
    } else {
      // Fallback for older browsers
      fallbackCopyToClipboard(url);
    }
  };

  // Fallback copy function for older browsers
  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Link copied to clipboard!');
        setShowShareModal(false);
      } else {
        alert('Failed to copy link. Please copy manually:\n' + text);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('Failed to copy link. Please copy manually:\n' + text);
    }
    
    document.body.removeChild(textArea);
  };

  return (
    <div className="wall-designer-root">
      {/* Professional Background Elements */}
      <div className="geometric-accent"></div>
      <div className="grid-pattern"></div>
      <div className="floating-particles"></div>
      {/* Modern Header Bar */}
      <div className="modern-header">
        <div className="header-left">
          <div className="user-info">
            <div className="user-avatar">
              {(localStorage.getItem("userEmail") || "U").charAt(0).toUpperCase()}
            </div>
            <span className="user-email">
              {localStorage.getItem("userEmail") || "user@example.com"}
            </span>
          </div>
          <div className="brand-section">
            <div className="brand-icon">🎨</div>
            <div className="brand-text">
              <span className="brand-name">Wall Designer</span>
              <span className="brand-badge">PRO</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          {localStorage.getItem('isAdmin') === '1' && (
            <button className="modern-btn admin-btn" onClick={() => navigate('/admin')}>
              <span className="btn-icon">🛠️</span>
              <span className="btn-text">Admin</span>
            </button>
          )}
          <button className="modern-btn profile-btn" onClick={handleProfile}>
            <span className="btn-icon">👤</span>
            <span className="btn-text">Profile</span>
          </button>
          <button className="modern-btn logout-btn" onClick={handleLogout}>
            <span className="btn-icon">⎋</span>
            <span className="btn-text">Logout</span>
          </button>
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
        <div className="action-buttons-left">
          <button className="modern-action-btn reset-btn" onClick={handleNewDesign}>
            <span className="action-icon">↻</span>
            <span className="action-text">Reset View</span>
          </button>
          <button className="modern-action-btn save-btn" onClick={handleSaveDraft}>
            <span className="action-icon">💾</span>
            <span className="action-text">{currentDraftId ? 'Update Draft' : 'Save Draft'}</span>
          </button>
          {saveError && (
            <div style={{ 
              color: '#ff4444', 
              fontSize: '12px', 
              marginLeft: '8px',
              maxWidth: '200px',
              wordWrap: 'break-word'
            }}>
              ❌ {saveError}
            </div>
          )}
        </div>
        <div className="divider-line" />
        <div className="action-buttons-right">
          <button className="modern-action-btn share-btn" onClick={handleShare}>
            <span className="action-icon">🔗</span>
            <span className="action-text">Share</span>
          </button>
          <button className="modern-action-btn download-btn" onClick={() => setShowExportModal(true)}>
            <span className="action-icon">⬇️</span>
            <span className="action-text">Export</span>
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
                <div className="canvas-size-inline" style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'nowrap', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="canvas-width" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Width</label>
                    <input id="canvas-width" type="number" name="width" value={inputWidth} min={100} max={800} onChange={handleInputChange} style={{ width: '100%', height: '32px', fontSize: '13px', padding: '6px 8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="canvas-height" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Height</label>
                    <input id="canvas-height" type="number" name="height" value={inputHeight} min={100} max={2000} onChange={handleInputChange} style={{ width: '100%', height: '32px', fontSize: '13px', padding: '6px 8px' }} />
                  </div>
                  <button className="action-btn reset-save-btn" style={{ minWidth: 50, height: '32px', padding: '6px 12px', background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: 8, fontSize: '12px' }} onClick={handleSetWallSize}>Set</button>
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
                  marginBottom: 8
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
              {/* Removed Debug Info panel */}
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
                      console.log('Decoration clicked:', item.name, item.url);
                      const newOverlay = {
                        url: item.url,
                        name: item.name,
                        x: 20 + decorationOverlays.length * 30,
                        y: 20 + decorationOverlays.length * 30,
                        width: 80,
                        height: 60
                      };
                      console.log('Adding new overlay:', newOverlay);
                      setDecorationOverlays(prev => {
                        const newArray = [...prev, newOverlay];
                        console.log('Updated decorationOverlays:', newArray);
                        return newArray;
                      });
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
              <div className="section-card" style={{ border: '2px solid #007bff', backgroundColor: '#f8f9ff' }}>
                <div className="section-title" style={{ color: '#007bff', fontWeight: 'bold' }}>
                  Selected Decorations (Count: {decorationOverlays.length})
                </div>

                {decorationOverlays.length === 0 ? (
                  <div style={{ color: '#888', fontSize: 14, padding: '10px', textAlign: 'center', backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                    No decorations selected
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                    {decorationOverlays.map((dec, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fff', borderRadius: 6, border: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={dec.url} alt={dec.name || 'Decoration'} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: '#f8f9fa', border: '1px solid #ececec' }} />
                          <div style={{ fontSize: 13, color: '#333' }}>{dec.name || 'Decoration'} #{idx + 1}</div>
                        </div>
                        <button className="delete-btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => deleteDecorationOverlay(idx)}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}
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
                    {/* Delete button overlay */}
                    <button
                      className="delete-btn"
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        zIndex: 10,
                        background: '#ff4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 16,
                        lineHeight: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                      }}
                      title="Delete image"
                      onClick={() => deleteImage(img.id)}
                    >
                      ×
                    </button>
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

      {/* Enhanced Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="export-modal" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.2)',
            border: '1px solid rgba(232, 236, 247, 0.8)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '24px', 
                fontWeight: '700', 
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '8px'
              }}>
                Export Design
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                Choose your export format and quality settings
              </p>
            </div>

            {/* Format Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                📁 Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { value: 'png', label: 'PNG', desc: 'Best quality, transparent background' },
                  { value: 'jpeg', label: 'JPEG', desc: 'Smaller file size, solid background' },
                  { value: 'webp', label: 'WebP', desc: 'Modern format, great compression' }
                ].map(format => (
                  <button
                    key={format.value}
                    onClick={() => setExportFormat(format.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: exportFormat === format.value ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                      background: exportFormat === format.value ? '#f3f4f6' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>{format.label}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{format.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#374151'
                }}>
                  📐 Resolution
                </label>
                <div style={{
                  background: plan === 'basic' 
                    ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                    : plan === 'pro' 
                    ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                    : 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {plan.replace('_', ' ')} PLAN
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${
                plan === 'basic' ? 1 : plan === 'pro' ? 2 : 3
              }, 1fr)`, gap: '8px' }}>
                {[
                  { value: '720p', label: '720p', desc: '1280×720 - Standard', plans: ['basic', 'pro', 'pro_max'] },
                  { value: '1080p', label: '1080p', desc: '1920×1080 - Full HD', plans: ['pro', 'pro_max'] },
                  { value: '4k', label: '4K', desc: '3840×2160 - Ultra HD', plans: ['pro_max'] }
                ].filter(res => res.plans.includes(plan)).map(res => (
                  <button
                    key={res.value}
                    onClick={() => setExportResolution(res.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: exportResolution === res.value ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                      background: exportResolution === res.value ? '#f3f4f6' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>{res.label}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{res.desc}</div>
                  </button>
                ))}
              </div>
              
              {/* Upgrade Prompt for Better Resolutions */}
              {plan === 'basic' && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '10px',
                  border: '1px solid #f59e0b',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>
                    🚀 Want Higher Resolution?
                  </div>
                  <div style={{ fontSize: '12px', color: '#a16207' }}>
                    Upgrade to <strong>Pro</strong> for 1080p or <strong>Pro Max</strong> for 4K exports
                  </div>
                </div>
              )}
              
              {plan === 'pro' && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                  borderRadius: '10px',
                  border: '1px solid #ec4899',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#be185d', marginBottom: '4px' }}>
                    👑 Want Ultra HD 4K?
                  </div>
                  <div style={{ fontSize: '12px', color: '#be185d' }}>
                    Upgrade to <strong>Pro Max</strong> for 4K (3840×2160) exports
                  </div>
                </div>
              )}
            </div>

            {/* Quality Selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                ⭐ Quality
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { value: 'low', label: 'Low', desc: 'Fast export' },
                  { value: 'medium', label: 'Medium', desc: 'Balanced' },
                  { value: 'high', label: 'High', desc: 'Best quality' }
                ].map(quality => (
                  <button
                    key={quality.value}
                    onClick={() => setExportQuality(quality.value)}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: exportQuality === quality.value ? '2px solid #7c3aed' : '2px solid #e5e7eb',
                      background: exportQuality === quality.value ? '#f3f4f6' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#374151' }}>{quality.label}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{quality.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  background: '#ffffff',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.background = '#ffffff'}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isExporting 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (!isExporting) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExporting) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.3)';
                  }
                }}
              >
                {isExporting && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
                {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
              </button>
            </div>

            {/* Loading spinner animation */}
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        </div>
      )}
    </div>
  );
}

export default WallDesigner; 