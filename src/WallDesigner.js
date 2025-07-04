import React, { useState, useRef } from "react";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import "./App.css";

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
  const [defaultFrame, setDefaultFrame] = useState('none');
  const [defaultFrameThickness, setDefaultFrameThickness] = useState(4);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const wallRef = useRef(null);

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
    // Calculate scale factors
    const scaleX = inputWidth / wallSize.width;
    const scaleY = inputHeight / wallSize.height;
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
    setWallSize({ width: inputWidth, height: inputHeight });
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

  // Add frame to each image
  const handleFrameChange = (id, frame) => {
    setUploadedImages((prev) => prev.map(img => img.id === id ? { ...img, frame } : img));
  };

  // Add thickness to each image
  const handleFrameThicknessChange = (id, thickness) => {
    setUploadedImages((prev) => prev.map(img => img.id === id ? { ...img, frameThickness: thickness } : img));
  };

  // Add color to each image
  const handleFrameColorChange = (id, color) => {
    setUploadedImages((prev) => prev.map(img => img.id === id ? { ...img, frameColor: color } : img));
  };

  // When Default Frame changes, apply to selected image
  const handleDefaultFrameChange = (e) => {
    const frame = e.target.value;
    setDefaultFrame(frame);
    if (selectedImageId) {
      setUploadedImages((prev) => prev.map(img => img.id === selectedImageId ? { ...img, frame } : img));
    }
  };

  // Download wall as image
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
      {/* Design Area: Wall container (center) and right controls */}
      <div style={{
        marginTop: 12,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: 32
      }}>
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
            backgroundColor:'lightblue'
          }}>
            {wallImage && (
              <div ref={wallRef} style={{
                position: 'relative',
                width: wallSize.width,
                height: wallSize.height,
              }}>
                <img
                  src={wallImage}
                  alt="Wall Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    border: '2px solid #ccc',
                    borderRadius: 8,
                    display: 'block',
                  }}
                />
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
                    <div className="image-frame" style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <button
                        className="delete-btn"
                        onClick={() => deleteImage(img.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                      {/* Use regular <img> with CSS clip-path for shape masking */}
                      <img
                        src={img.url}
                        alt={img.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          pointerEvents: 'auto',
                          ...getFrameStyle(img.frame || 'none', img.frameThickness || 4, img.frameColor || '#333'),
                          background: '#fff',
                          ...getShapeStyle(img.shape),
                        }}
                        onClick={() => setSelectedImageId(img.id)}
                      />
                    </div>
                  </Rnd>
                ))}
              </div>
            )}
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
            {/* Heading Background Color Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>Heading Background:</span>
              <input type="color" value={headingBg} onChange={e => setHeadingBg(e.target.value)} />
            </div>
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
                max={2000}
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
            {/* Default Frame and Thickness Controls: only show if no image is selected */}
            {!selectedImageId && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>Default Frame:</span>
                  <select
                    value={defaultFrame}
                    onChange={e => setDefaultFrame(e.target.value)}
                    style={{ fontSize: 14, padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#fff' }}
                  >
                    <option value="none">No Frame</option>
                    <option value="shadow">Shadow</option>
                    <option value="gold">Gold</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="double">Double</option>
                    <option value="gradient">Gradient</option>
                    <option value="embossed">Embossed</option>
                    <option value="wood">Wood</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>Default Thickness:</span>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={defaultFrameThickness}
                    onChange={e => setDefaultFrameThickness(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: 24, textAlign: 'right' }}>{defaultFrameThickness}px</span>
                </div>
              </>
            )}
            {/* Per-image frame controls for selected image */}
            {selectedImageId && (() => {
              const selectedImg = uploadedImages.find(img => img.id === selectedImageId);
              if (!selectedImg) return null;
              return (
                <div style={{ marginTop: 16, background: '#f0f4fa', borderRadius: 8, padding: 12 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Selected Image Frame</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>Style:</span>
                    <select
                      value={selectedImg.frame || 'none'}
                      onChange={e => handleFrameChange(selectedImg.id, e.target.value)}
                      style={{ fontSize: 14, padding: '2px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#fff' }}
                    >
                      <option value="none">No Frame</option>
                      <option value="shadow">Shadow</option>
                      <option value="gold">Gold</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                      <option value="double">Double</option>
                      <option value="gradient">Gradient</option>
                      <option value="embossed">Embossed</option>
                      <option value="wood">Wood</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14 }}>Thickness:</span>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={selectedImg.frameThickness || 4}
                      onChange={e => handleFrameThicknessChange(selectedImg.id, Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ minWidth: 24, textAlign: 'right' }}>{selectedImg.frameThickness || 4}px</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>Color:</span>
                    <input
                      type="color"
                      value={selectedImg.frameColor || '#333'}
                      onChange={e => handleFrameColorChange(selectedImg.id, e.target.value)}
                      style={{ width: 32, height: 32, border: 'none', background: 'none' }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WallDesigner; 