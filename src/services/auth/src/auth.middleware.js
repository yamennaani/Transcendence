const { verifyAccessToken } = require('./utils');

exports.authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token provided');
        return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyAccessToken(token);
        console.log('Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// exports.authenticate = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ error: 'Missing or invalid token' });
//     }
//     const token = authHeader.split(' ')[1];
//     try {
//         const decoded = verifyAccessToken(token);
//         req.user = decoded;
//         next();
//     } catch (err) {
//         if (err.name === 'TokenExpiredError') {
//             return res.status(401).json({ error: 'Token expired', message: err.message });
//         }
//         return res.status(403).json({ error: 'Invalid token' });
//     }
// };