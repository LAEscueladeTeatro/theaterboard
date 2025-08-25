import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';

const CameraAttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [iaModelsLoaded, setIaModelsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setIaModelsLoaded(true);
      } catch (error) {
        console.error("Error loading AI models:", error);
        setError("Error al cargar los modelos de IA. Por favor, intente de nuevo más tarde.");
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;

    const startCamera = async () => {
      if (!iaModelsLoaded) return;
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
        setLoading(false);
      }
    };

    startCamera();

    return () => {
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [iaModelsLoaded]);

  const intervalRef = useRef(null);

  const handleVideoPlay = () => {
    intervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const displaySize = { width: video.clientWidth, height: video.clientHeight };

        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
        }
      }
    }, 100);
  };

  useEffect(() => {
    const videoElement = videoRef.current;

    const cleanup = () => {
      if (videoElement) {
        videoElement.removeEventListener('play', handleVideoPlay);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    if (videoElement && iaModelsLoaded && !loading) {
      videoElement.addEventListener('play', handleVideoPlay);
    }

    return cleanup;
  }, [iaModelsLoaded, loading]);


  const getLoadingMessage = () => {
    if (!iaModelsLoaded) {
      return "Cargando modelos de IA...";
    }
    if (loading) {
      return "Cargando cámara...";
    }
    return null;
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Asistencia por Cámara</h1>
      <div style={{ position: 'relative', width: 'clamp(300px, 80vw, 640px)', margin: '20px auto', border: '2px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
        {(loading || !iaModelsLoaded) && <div style={{ padding: '20px' }}>{getLoadingMessage()}</div>}
        {error && <div style={{ color: 'red', padding: '20px' }}>{error}</div>}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: 'auto', display: (loading || error || !iaModelsLoaded) ? 'none' : 'block', verticalAlign: 'middle' }}
          onCanPlay={() => setLoading(false)}
        />
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
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
