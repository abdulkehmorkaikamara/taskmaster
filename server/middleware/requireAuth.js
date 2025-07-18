// middleware/requireAuth.js
const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  // The token is sent as 'Bearer <token>'
  const token = authorization.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the user's email to the request object for later use
    req.user = { email: payload.email };
    next(); // Move on to the next function in the chain
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

module.exports = requireAuth;
