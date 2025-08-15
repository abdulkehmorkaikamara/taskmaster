const jwt = require('jsonwebtoken');

/**
 * Express middleware to protect routes using JWT.
 * Supports token in Authorization header (Bearer) or HTTP-only cookie.
 */
const requireAuth = (req, res, next) => {
  let token;

  // 1) Check `Authorization: Bearer <token>` header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // 2) Fallback to HTTP-only cookie named AuthToken
  else if (req.cookies && req.cookies.AuthToken) {
    token = req.cookies.AuthToken;
  }

  // 3) If still no token, reject
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    // Verify & decode
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user info to request
    req.user = payload; 
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = requireAuth;
