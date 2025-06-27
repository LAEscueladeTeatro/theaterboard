// La URL base de la API.
// Para producción, esta variable se establecerá en el entorno de despliegue (ej. Render).
// Para desarrollo local, si VITE_API_BASE_URL no está definida en un .env, usará el fallback.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
