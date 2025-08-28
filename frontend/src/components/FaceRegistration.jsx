import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import { API_BASE_URL } from '../config';
import Spinner from './Spinner';

const FaceRegistration = ({ studentId, userType = 'student', onClose, isOpen }) => {
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [captureStep, setCaptureStep] = useState(0); // 0: inactivo, 1: frente, 2: izq, 3: der, 4: preview
  const [collectedDescriptors, setCollectedDescriptors] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);

  const videoRef = useRef();
  const canvasRef = useRef();

  const getToken = useCallback(() => {
    return userType === 'teacher' ? localStorage.getItem('teacherToken') : localStorage.getItem('studentToken');
  }, [userType]);

  // Cargar los modelos de face-api.js
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // Asume que los modelos están en public/models
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setFaceApiLoaded(true);
      } catch (error) {
        console.error("Error loading face-api models", error);
        setError("No se pudieron cargar las herramientas de IA. Inténtalo de nuevo.");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const startVideo = async () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }

      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(cameras);

        if (cameras.length > 0) {
          const deviceId = cameras[activeDeviceIndex]?.deviceId;
          const constraints = { video: { deviceId: deviceId ? { exact: deviceId } : undefined } };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } else {
          setError("No se encontraron cámaras.");
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("No se pudo acceder a la cámara. Revisa los permisos en tu navegador.");
      }
    };

    if (isOpen) {
      setError('');
      setSuccess('');
      setCaptureStep(1);
      setCollectedDescriptors([]);
      startVideo();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, activeDeviceIndex]);

  const handleCameraChange = () => {
    setActiveDeviceIndex(prevIndex => (prevIndex + 1) % videoDevices.length);
  };

  const handleRestartCapture = () => {
    setCollectedDescriptors([]);
    setCaptureStep(1);
    setError('');
    setSuccess('');
    // The main useEffect will handle restarting the video when the capture step changes.
    // No need to call startVideo() directly.
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    setError('');

    const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setError("No se detectó rostro. Inténtalo de nuevo.");
      setIsCapturing(false);
      return;
    }

    const newDescriptors = [...collectedDescriptors, Array.from(detections.descriptor)];
    setCollectedDescriptors(newDescriptors);

    if (captureStep < 3) {
      setCaptureStep(captureStep + 1);
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      setCaptureStep(4);
    }
    setIsCapturing(false);
  };

  const handleSaveFace = async () => {
    if (collectedDescriptors.length < 3) {
      setError("No se han completado las 3 capturas necesarias.");
      return;
    }
    setIsCapturing(true);
    setError('');
    setSuccess('');

    const token = getToken();
    let url = '';
    if (userType === 'teacher') {
        url = `${API_BASE_URL}/admin/students/${studentId}/register-face`;
    } else {
        url = `${API_BASE_URL}/student/register-face`;
    }

    try {
      await axios.post(url, { descriptors: collectedDescriptors }, { headers: { 'x-auth-token': token } });
      setSuccess("¡Rostros registrados exitosamente!");
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error("Error saving face descriptors:", err);
      setError(err.response?.data?.message || "Error al guardar los rostros en el servidor.");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  const instructions = {
    1: "Paso 1 de 3: Mira directamente a la cámara.",
    2: "Paso 2 de 3: Gira tu rostro ligeramente a la izquierda.",
    3: "Paso 3 de 3: Gira tu rostro ligeramente a la derecha.",
    4: "¡Capturas completadas! Revisa y guarda."
  };

  const guideImages = {
    1: '/assets/guide-front.png',
    2: '/assets/guide-left.png',
    3: '/assets/guide-right.png',
  };

  const isFrontCamera = videoDevices[activeDeviceIndex]?.label.toLowerCase().includes('front');

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{textAlign: 'center', width: '90%', maxWidth: '500px'}}>
        <h3>{instructions[captureStep]}</h3>
        <p>Asegúrate de que tu rostro esté bien iluminado y centrado.</p>
        <div style={{ position: 'relative', width: '100%', paddingTop: '75%', backgroundColor: '#111', borderRadius: '8px', overflow: 'hidden' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '8px',
              transform: isFrontCamera ? 'scaleX(-1)' : 'none',
              display: captureStep <= 3 ? 'block' : 'none'
            }}
          ></video>
          {captureStep <= 3 && (
            <img
              src={guideImages[captureStep]}
              alt="Guía Facial"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.6,
                objectFit: 'contain',
                pointerEvents: 'none'
              }}
            />
          )}
           {captureStep > 3 && <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>Video pausado.</div>}
        </div>
        <div style={{marginTop: '1rem', minHeight: '2.5rem'}}>
          {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}
          {success && <p style={{color: 'green', marginBottom: '1rem'}}>{success}</p>}
          {captureStep <= 3 && <p>Capturas realizadas: {collectedDescriptors.length} de 3</p>}
        </div>

        {videoDevices.length > 1 && captureStep <= 3 && (
          <div style={{ margin: '1rem 0' }}>
            <button onClick={handleCameraChange} className="btn-secondary">
              Cambiar Cámara 🔄
            </button>
          </div>
        )}

        <div className="modal-actions" style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          {captureStep <= 3 && (
            <>
              <button onClick={onClose} className="btn-secondary" disabled={isCapturing}>Cancelar</button>
              <button onClick={handleCapture} className="btn-primary" disabled={isCapturing || !faceApiLoaded}>
                {isCapturing ? <><Spinner size="20px" color="white" /> Capturando...</> : (faceApiLoaded ? `Capturar Foto ${captureStep}`: 'Cargando IA...')}
              </button>
            </>
          )}
          {captureStep > 3 && (
            <>
              <button onClick={handleRestartCapture} className="btn-secondary" disabled={isCapturing}>Empezar de Nuevo</button>
              <button onClick={handleSaveFace} className="btn-primary" disabled={isCapturing}>
                {isCapturing ? <><Spinner size="20px" color="white" /> Guardando...</> : 'Guardar Registros'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;
