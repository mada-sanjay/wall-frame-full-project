import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Helper functions copied from WallDesigner.js for consistent styling
function getShapeStyle(shape) {
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%' };
    case 'diamond':
      return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', borderRadius: 0 };
    case 'rhombus':
      return { clipPath: 'polygon(25% 50%, 50% 100%, 75% 50%, 50% 0%)', borderRadius: 0 };
    case 'square':
    default:
      return { borderRadius: 8 };
  }
}

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
      return { border: `${thickness}px solid transparent`, borderImage: 'linear-gradient(45deg, #f3ec78, #af4261) 1' };
    case 'embossed':
      return { border: `${thickness}px solid ${color}`, boxShadow: '0 2px 8px #fff, 0 -2px 8px #aaa' };
    case 'wood':
      return { border: `${thickness}px solid #8B5C2A` };
    case 'none':
    default:
      return { border: 'none', boxShadow: 'none' };
  }
}

function SharedDraftViewer() {
  const { token } = useParams();
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetch(`/api/shared/${token}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Design not found or failed to load.');
          }
          return res.json();
        })
        .then(data => {
          // The session_data is a JSON string, so we need to parse it
          const sessionData = typeof data.session_data === 'string' ? JSON.parse(data.session_data) : data.session_data;
          setDraft(sessionData);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [token]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '20px' }}>Loading your design...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '20px', color: 'red' }}>Error: {error}</div>;
  }

  if (!draft) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '20px' }}>No design data found.</div>;
  }

  const { wallSize, wallImage, uploadedImages = [], decorationOverlays = [] } = draft;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4fa', padding: '20px' }}>
      <div
        style={{
          position: 'relative',
          width: wallSize.width,
          height: wallSize.height,
          background: wallImage ? '#fff' : '#e0e0e0',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Wall Background Image */}
        {wallImage && (
          <img
            src={wallImage}
            alt="Wall Background"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
        )}

        {/* Render Uploaded Images (Read-Only) */}
        {uploadedImages.map((img) => (
          <div
            key={img.id}
            style={{
              position: 'absolute',
              left: img.x,
              top: img.y,
              width: img.width,
              height: img.height,
              zIndex: 2,
              ...getFrameStyle(img.frame),
              ...getShapeStyle(img.shape),
            }}
          >
            <img
              src={img.url}
              alt={img.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                ...getShapeStyle(img.shape),
              }}
            />
          </div>
        ))}

        {/* Render Decoration Overlays (Read-Only) */}
        {decorationOverlays.map((dec, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: dec.x,
              top: dec.y,
              width: dec.width,
              height: dec.height,
              zIndex: 15,
            }}
          >
            <img
              src={dec.url}
              alt={dec.name}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SharedDraftViewer; 