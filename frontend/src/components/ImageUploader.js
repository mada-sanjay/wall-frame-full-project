import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Draggable from 'react-draggable';

function getCroppedImg(imageSrc, crop, zoom, aspect) {
  // Utility to get the cropped image as a blob or data URL
  // For simplicity, this function returns a promise with a data URL
  return new Promise((resolve) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = image.naturalWidth / image.width;
      canvas.width = crop.width * scale;
      canvas.height = crop.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        crop.x * scale,
        crop.y * scale,
        crop.width * scale,
        crop.height * scale,
        0,
        0,
        crop.width * scale,
        crop.height * scale
      );
      resolve(canvas.toDataURL('image/jpeg'));
    };
  });
}

const ImageUploader = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const onSelectFile = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = () => {
        setImageSrc(reader.result);
        setCroppedImage(null); // Reset cropped image
      };
    }
  };

  const showCroppedImage = useCallback(async () => {
    try {
      const croppedImg = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        zoom,
        4 / 3 // aspect ratio
      );
      setCroppedImage(croppedImg);
    } catch (e) {
      console.error(e);
    }
  }, [imageSrc, croppedAreaPixels, zoom]);

  return (
    <div>
      <div style={{ position: 'relative', width: 400, height: 300, margin: '20px 0' }}>
        {imageSrc && !croppedImage && (
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        )}
      </div>
      {imageSrc && !croppedImage && (
        <button onClick={showCroppedImage}>Crop</button>
      )}
      {croppedImage && (
        <Draggable>
          <img
            src={croppedImage}
            alt="Cropped"
            style={{ maxWidth: '100%', maxHeight: 300, cursor: 'move', border: '2px solid #333' }}
          />
        </Draggable>
      )}
    </div>
  );
};

export default ImageUploader; 