const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const { authenticate, requireRole } = require('./auth.middleware');

const limiter = (max, message) => rateLimit({
    windowMs: 15 * 60 * 1000, max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(200).json({ ok: false, error: message, code: 429 });
    },
});

router.post('/register',        limiter(5,  'Too many requests. Please try again in 15 minutes.'),  authController.register);
router.post('/login',           limiter(10, 'Too many attempts. Please try again in 15 minutes.'),  authController.login);
router.post('/refresh',         authController.refresh);
router.post('/logout',          authController.logout);
router.get('/me',               authenticate, authController.getMe);
router.post('/forgot-password', limiter(5,  'Too many requests. Please try again in 15 minutes.'),  authController.forgotPassword);
router.post('/reset-password',  limiter(5,  'Too many requests. Please try again in 15 minutes.'),  authController.resetPassword);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/verify-email', authController.verifyEmail);
router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);

// Invitation management — Admin and Bocal only
router.post('/invite', authenticate, requireRole('Admin', 'Bocal'), authController.createInvite);
router.get('/invites', authenticate, requireRole('Admin', 'Bocal'), authController.getInvites);
router.delete('/invite/:id', authenticate, requireRole('Admin', 'Bocal'), authController.revokeInvite);

module.exports = router;