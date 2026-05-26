const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
// const authService = require('./auth.service')
const { authenticate } = require('./auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/verify-email', authController.verifyEmail);
router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);
module.exports = router;