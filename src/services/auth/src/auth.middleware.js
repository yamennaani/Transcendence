const { verifyAccessToken } = require('./utils');
const { findUserById } = require('./auth.userModel');
const { UnauthorizedError, ForbiddenError } = require('../packages/errors');

exports.authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Missing or invalid token'));
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = verifyAccessToken(token);
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Token expired'));
        }
        next(new ForbiddenError('Invalid token'));
    }
};

exports.requireRole = (...roles) => async (req, res, next) => {
    if (!req.user) {
        return next(new UnauthorizedError('Not authenticated'));
    }
    try {
        const user = await findUserById(req.user.userId);
        if (!user || !roles.includes(user.role)) {
            throw new ForbiddenError('Insufficient permissions');
        }
        next();
    } catch (err) {
        next(err);
    }
};