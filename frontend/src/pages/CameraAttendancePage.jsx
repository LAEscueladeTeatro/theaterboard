import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';

const CameraAttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [iaModelsLoaded, setIaModelsLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [labeledDescriptors, setLabeledDescriptors] = useState([]);
  const [recentlyMarkedIds, setRecentlyMarkedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);


  useEffect(() => {
    const loadModelsAndDescriptors = async () => {
      const MODEL_URL = '/models';
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceDescriptorExtractor.loadFromUri(MODEL_URL)
        ]);
        setIaModelsLoaded(true);

        const token = getToken();
        if (!token) {
          setError("No autenticado. Por favor, inicie sesión.");
          setLoading(false);
          return;
        }
        const response = await axios.get(`${API_BASE_URL}/admin/students/all-face-descriptors`, {
          headers: { 'x-auth-token': token }
        });

        if (response.data && response.data.length > 0) {
          const fetchedDescriptors = response.data.map(d =>
            new faceapi.LabeledFaceDescriptors(d.label, [Float32Array.from(d.descriptor)])
          );
          setLabeledDescriptors(fetchedDescriptors);
        } else {
          console.warn("No se encontraron descriptores faciales registrados.");
          setFaceMatcher(new faceapi.FaceMatcher([])); // Create empty matcher
        }
      } catch (error) {
        console.error("Error loading models or descriptors:", error);
        setError("Error al cargar datos de IA. Verifique la consola para más detalles.");
      }
    };
    loadModelsAndDescriptors();
  }, [getToken]);

  useEffect(() => {
    if (labeledDescriptors.length > 0) {
      setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
    }
  }, [labeledDescriptors]);

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
      if (videoRef.current && canvasRef.current && !videoRef.current.paused && !videoRef.current.ended && faceMatcher) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const displaySize = { width: video.clientWidth, height: video.clientHeight };

        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));

        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const label = result.label;
            const drawBox = new faceapi.draw.DrawBox(box, { label: label });
            drawBox.draw(canvas);

            // Lógica de marcado de asistencia
            if (label !== 'unknown' && label !== 'Desconocido') {
              const studentIdMatch = label.match(/\((ET\d{3})\)/);
              if (studentIdMatch && studentIdMatch[1]) {
                const studentId = studentIdMatch[1];
                if (!recentlyMarkedIds.has(studentId)) {
                  markAttendance(studentId, label.split(' (')[0]);
                }
              }
            }
          });
        }
      }
    }, 1000); // Intervalo de 1 segundo para no sobrecargar
  };

  const markAttendance = async (studentId, studentName) => {
    setRecentlyMarkedIds(prev => new Set(prev).add(studentId));
    toast.success(`Asistencia marcada para: ${studentName}`, { duration: 2000 });

    try {
      const token = getToken();
      await axios.post(`${API_BASE_URL}/attendance/record`, {
        student_id: studentId,
        attendance_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        status: 'PUNTUAL',
        notes: 'Marcado por reconocimiento facial'
      }, {
        headers: { 'x-auth-token': token }
      });
    } catch (error) {
      console.error(`Error marcando asistencia para ${studentId}:`, error);
      toast.error(`Error al marcar a ${studentName}`);
      // Si falla, quitarlo de la lista para permitir reintentos
      setRecentlyMarkedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }

    // Permitir marcar de nuevo al mismo estudiante después de 2 minutos
    setTimeout(() => {
      setRecentlyMarkedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }, 120000); // 2 minutos
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
    if (!iaModelsLoaded) return "Cargando modelos de IA...";
    if (!faceMatcher) return "Preparando reconocedor facial...";
    if (loading) return "Cargando cámara...";
    return null;
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Asistencia por Cámara</h1>
      <div style={{ position: 'relative', width: 'clamp(300px, 80vw, 640px)', margin: '20px auto', border: '2px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
        {(loading || !iaModelsLoaded || !faceMatcher) && <div style={{ padding: '20px' }}>{getLoadingMessage()}</div>}
        {error && <div style={{ color: 'red', padding: '20px' }}>{error}</div>}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: 'auto', display: (loading || error || !iaModelsLoaded || !faceMatcher) ? 'none' : 'block', verticalAlign: 'middle' }}
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
