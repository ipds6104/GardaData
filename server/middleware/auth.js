const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }
    
    // Auth header is usually "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'gardadatajwtsecret12345!');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid or Expired Token' });
    }
};

module.exports = authMiddleware;
