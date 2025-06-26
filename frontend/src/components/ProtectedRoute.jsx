import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ tokenType = 'teacherToken', redirectTo = '/docente/login' }) => {
  const token = localStorage.getItem(tokenType);

  // Lógica simple: si no hay token, redirige.
  // Podría expandirse para verificar la validez del token (ej. decodificándolo y revisando la expiración)
  if (!token) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />; // Renderiza el componente hijo (la ruta protegida)
};

export default ProtectedRoute;
