import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CameraAttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const videoElement = videoRef.current; // Capture videoRef.current

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      } catch (err) {
        let errorMessage = 'Ocurrió un error al acceder a la cámara.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Permiso para acceder a la cámara denegado. Por favor, habilita el acceso en la configuración de tu navegador.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No se encontró ninguna cámara web en tu dispositivo.';
        }
        setError(errorMessage);
        setLoading(false); // Set loading to false only on error
      }
    };

    startCamera();

    return () => {
      // Cleanup using the captured value
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Asistencia por Cámara</h1>
      <div style={{ position: 'relative', width: 'clamp(300px, 80vw, 640px)', margin: '20px auto', border: '2px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
        {loading && <div style={{ padding: '20px' }}>Cargando cámara...</div>}
        {error && <div style={{ color: 'red', padding: '20px' }}>{error}</div>}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: 'auto', display: loading || error ? 'none' : 'block', verticalAlign: 'middle' }}
          onCanPlay={() => setLoading(false)}
        />
      </div>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button onClick={() => navigate(-1)} className="btn-action btn-secondary">
          &larr; Volver
        </button>
        <Link to="/docente/dashboard" className="btn-action">
          Ir al Dashboard
        </Link>
      </div>
    </div>
  );
};

export default CameraAttendancePage;
