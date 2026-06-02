const { verifyAccessToken } = require('./utils');
const { findUserById } = require('./auth.userModel');

exports.authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = verifyAccessToken(token);
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

exports.requireRole = (...roles) => async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const user = await findUserById(req.user.userId);
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    } catch (err) {
        console.error('requireRole error:', err);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};