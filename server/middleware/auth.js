const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./jwtSecret');

const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }
    
    // Auth header is usually "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    try {
        const secret = getJwtSecret();
        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid or Expired Token' });
    }
};

module.exports = authMiddleware;
