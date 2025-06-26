const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Obtener token del header
  const token = req.header('x-auth-token');

  // Verificar si no hay token
  if (!token) {
    return res.status(401).json({ message: 'No hay token, autorización denegada.' });
  }

  // Verificar token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user; // Añadir el payload del usuario al objeto request
    next();
  } catch (err) {
    console.error('Error al verificar token:', err.message);
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token ha expirado.' });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token no es válido.' });
    }
    res.status(500).json({ message: 'Error del servidor al validar token.' });
  }
};
