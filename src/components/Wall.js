// Wall.js
import React, { useState, useRef } from "react";
import "./Wall.css";

const Wall = ({ wallSize: initialWallSize }) => {
  const [wallImage, setWallImage] = useState(null);
  const [wallSize, setWallSize] = useState(initialWallSize);
  const wallUploadInputRef = useRef(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedShape, setSelectedShape] = useState('square');
  const multiImageInputRef = useRef(null);
  const [wallWidthInput, setWallWidthInput] = useState(wallSize.width);
  const [wallHeightInput, setWallHeightInput] = useState(wallSize.height);

  const handleWallUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWallImage(URL.createObjectURL(file));
    }
  };

  const handleWallWidthChange = (e) => {
    setWallWidthInput(e.target.value);
  };

  const handleWallHeightChange = (e) => {
    setWallHeightInput(e.target.value);
  };

  const handleWallSizeSet = () => {
    const width = parseInt(wallWidthInput);
    const height = parseInt(wallHeightInput);
    if (width && height) {
      setWallSize({ width, height });
    }
  };

  const handleWallUploadClick = () => {
    wallUploadInputRef.current.click();
  };

  const handleMultiImageUploadClick = () => {
    multiImageInputRef.current.click();
  };

  const handleMultiImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then(images => {
      setUploadedImages(prev => [...prev, ...images]);
    });
    e.target.value = "";
  };

  const handleShapeSelect = (e) => {
    setSelectedShape(e.target.value);
  };

  return (
    <div className="main-container">
      <div className="top-controls">
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ marginRight: 8 }}>Upload Wall:</label>
          <button className="upload-btn" onClick={handleWallUploadClick}>Upload Wall</button>
          <input
            ref={wallUploadInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleWallUpload}
          />
          <label style={{ marginLeft: 16, marginRight: 4 }}>Width:</label>
          <input type="number" value={wallWidthInput} onChange={handleWallWidthChange} style={{ width: 80, marginRight: 8 }} />
          <label style={{ marginRight: 4 }}>Height:</label>
          <input type="number" value={wallHeightInput} onChange={handleWallHeightChange} style={{ width: 80, marginRight: 8 }} />
          <button onClick={handleWallSizeSet} style={{ marginLeft: 8 }}>Set</button>
        </div>
      </div>

      {wallImage && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="wall-preview-container" style={{
            margin: '32px 0 0 0',
            width: wallSize.width,
            height: wallSize.height,
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src={wallImage} alt="Wall Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div className="multi-image-upload-container" style={{
            margin: '32px 0 0 32px',
            padding: 24,
            background: '#fafbfc',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            minWidth: 260,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}>
            <label style={{ fontWeight: 'bold', marginBottom: 8 }}>Upload Images:</label>
            <button className="upload-btn" onClick={handleMultiImageUploadClick} style={{ marginBottom: 16 }}>Upload Images</button>
            <input
              ref={multiImageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={handleMultiImageUpload}
            />
            <label style={{ marginTop: 8 }}>Choose Shape:</label>
            <select value={selectedShape} onChange={handleShapeSelect} style={{ marginBottom: 16 }}>
              <option value="square">Square</option>
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="diamond">Diamond</option>
            </select>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {uploadedImages.map((img, idx) => (
                <img key={idx} src={img} alt={`uploaded-${idx}`} style={{
                  width: 48,
                  height: 48,
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '1px solid #ddd'
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wall;
