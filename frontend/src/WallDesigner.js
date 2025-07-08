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

function WallDesigner({ headingBg, setHeadingBg }) {
  const [wallSize, setWallSize] = useState({ width: 500, height: 300 });
  const [prevWallSize, setPrevWallSize] = useState({ width: 500, height: 300 });
  const [wallImage, setWallImage] = useState(null);
  const [shape, setShape] = useState('square');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [inputWidth, setInputWidth] = useState(wallSize.width);
  const [inputHeight, setInputHeight] = useState(wallSize.height);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [showDefaultWallImages, setShowDefaultWallImages] = useState(false);
  const [showDecorations, setShowDecorations] = useState(false);
  const [decorationOverlays, setDecorationOverlays] = useState([]);
  const [hoveredDecoration, setHoveredDecoration] = useState(null);
  const wallRef = useRef(null);
  const defaultWallImages = [
    '/julia-RuCVvjuyNeQ-unsplash (1).jpg',
    '/naomi-hebert-2dcYhvbHV-M-unsplash.jpg',
    '/spacejoy-IH7wPsjwomc-unsplash.jpg',
    '/pexels-pixabay-1640777.jpg',
    '/pexels-maksgelatin-4352247.jpg',
    
    // Add more local images here as needed
  ];
  const decorations = [
    { name: 'frame', url: '/frame_1.png' },
    { name: 'chair', url: '/chair.png' },
    { name: 'garland', url: '/garland-removebg-preview.png' },
    // { name: 'Image', url: '/garland_2.png' },
    { name: 'garland', url: '/one.png' },
    { name: 'Image', url: '/two.png' },
    { name: 'garland', url: '/three.png' }, 
    { name: 'flower', url: '/flower-removebg-preview.png'},   

    
   
    // Add more local images here as needed
    // Example: { name: 'New Image', url: '/your-new-image.jpg' },
    // Example: { name: 'Another Image', url: '/another-image.png' },
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const handleProfile = () => {
    navigate("/profile");
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
      const res = await fetch("/api/save-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email, session_data })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Draft saved successfully!");
      } else {
        alert(data.message || "Failed to save draft.");
      }
    } catch (err) {
      alert("Network error while saving draft.");
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
    const newImages = files.map((file, idx) => ({
      id: generateId(),
      url: URL.createObjectURL(file),
      name: file.name,
      x: 20 + (uploadedImages.length + idx) * 30,
      y: 20 + (uploadedImages.length + idx) * 30,
      width: 100,
      height: 100,
      shape: shape,
      frame: 'none',
    }));
    setUploadedImages((prev) => [...prev, ...newImages]);
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
        <div style={{ position: 'absolute', right: 24, top: 24, display: 'flex', gap: 12 }}>
          <button
            onClick={handleSaveDraft}
            style={{
              padding: "8px 20px",
              fontSize: 15,
              cursor: "pointer",
              background: "#fff",
              color: "#1976d2",
              border: "none",
              borderRadius: 6,
              fontWeight: 600
            }}
          >
            Save Draft
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 20px",
              fontSize: 15,
              cursor: "pointer",
              background: "#fff",
              color: "#1976d2",
              border: "none",
              borderRadius: 6,
              fontWeight: 600
            }}
          >
            Logout
          </button>
          <button
            onClick={handleProfile}
            style={{
              padding: "8px 20px",
              fontSize: 15,
              cursor: "pointer",
              background: "#fff",
              color: "#1976d2",
              border: "none",
              borderRadius: 6,
              fontWeight: 600
            }}
          >
            Profile
          </button>
        </div>
      </div>
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
                  disableDragging={false}
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
                        pointerEvents: 'none',
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
              Upload Images
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
    </div>
  );
}

export default WallDesigner; 