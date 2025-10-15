import React, { useRef, useState, useEffect } from 'react';

const WebcamCapture = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  initCamera();

  return () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };
}, []); // ← Fixed dependency warning

// Remove the separate startCamera function
 
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'webcam-capture.jpg', { type: 'image/jpeg' });
      const imageUrl = URL.createObjectURL(blob);
      onCapture(file, imageUrl);
      stopCamera();
      onClose();
    }, 'image/jpeg', 0.95);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(25px)',
        borderRadius: '25px',
        padding: '30px',
        maxWidth: '800px',
        width: '100%',
        border: '1px solid var(--glass-border)'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          color: 'white'
        }}>
          📷 Capture Your Photo
        </h2>

        {error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div style={{ position: 'relative' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                maxWidth: '640px',
                borderRadius: '15px',
                display: 'block',
                margin: '0 auto',
                transform: 'scaleX(-1)' // Mirror the video
              }}
            />
            
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '200px',
              height: '200px',
              border: '3px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '15px',
          marginTop: '20px',
          justifyContent: 'center'
        }}>
          <button
            onClick={captureImage}
            className="btn btn-primary"
            style={{ width: 'auto', padding: '15px 30px' }}
            disabled={!!error}
          >
            📸 Capture
          </button>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="btn"
            style={{ 
              width: 'auto', 
              padding: '15px 30px',
              background: 'var(--warning-gradient)'
            }}
          >
            ❌ Cancel
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '15px',
          opacity: 0.7,
          fontSize: '0.9rem',
          color: 'white'
        }}>
          Position your face in the center circle
        </p>
      </div>
    </div>
  );
};

export default WebcamCapture;