const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const logger = require('../packages/logger');
const { AppError, NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError } = require('../packages/errors');
require('dotenv').config();

const {
    findOrCreateOAuthUser,
    saveResetToken,
    findUserByResetToken,
    clearResetToken,
    updatePassword,
    createUser,
    findUserByEmail,
    findUserById,
    storeRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    deleteAllUserRefreshTokens,
    verifyEmail,
    findUserByVerificationToken,
    storeVerificationToken,
    isEmailAllowed,
    markEmailAsUsed,
    unmarkEmailAsUsed,
    deleteUserById,
    addAllowedEmail,
    getAllowedEmails,
    revokeAllowedEmail,
} = require('./auth.userModel');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken,
        validatePasswordStrength, sendResetEmail, sendVerificationEmail } = require('./utils');











exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ValidationError('Email and password required');
    }

    const allowedEmail = await isEmailAllowed(email);
    if (!allowedEmail) {
      throw new ForbiddenError('Registration not permitted for this email address.');
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      throw new ConflictError('Email already exists');
    }

    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      const err = new ValidationError('Password too weak');
      err.suggestions = passwordStrength.suggestions;
      throw err;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1hr

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Create user (new version returns user object with id, email, username)
    const user = await createUser(email, password, allowedEmail.orgId);
    await storeVerificationToken(user.id, tokenHash, expiresAt);
    await markEmailAsUsed(email);   // mark the allowed email as used

    try {
      await sendVerificationEmail(email, verificationUrl);
    } catch (emailErr) {
      logger.error('auth-service', 'Verification email failed, rolling back registration', { message: emailErr.message, stack: emailErr.stack });
      await deleteUserById(user.id);
      await unmarkEmailAsUsed(email);
      throw new AppError('Registration failed: could not send verification email. Please try again.', 500);
    }

    return res.status(201).json({
      id: user.id,
      email: user.email,
      message: 'Registration successful. Please verify your email before logging in.'
    });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ValidationError('Email and password required');
    }
    const user = await findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.pass_hash);
    if (!valid) {
      throw new UnauthorizedError('Invalid credentials');
    }
    if (!user.email_verified) {
      throw new ForbiddenError('Please verify your email before logging in.');
    }

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await storeRefreshToken(user.id, refreshToken, expiresAt);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth'
    });
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
    try {
        const oldRefreshToken = req.cookies.refreshToken;
        if (!oldRefreshToken) {
            throw new UnauthorizedError('No refresh token');
        }

        // 1. Check DB for old token (exists? not expired?)
        const storedToken = await findRefreshToken(oldRefreshToken); // uses hash lookup
        if (!storedToken || storedToken.expiresAt < new Date()) {
            throw new ForbiddenError('Invalid or expired refresh token');
        }

        // 2. Verify JWT signature
        const payload = verifyRefreshToken(oldRefreshToken);

        // 3. Delete the old refresh token from DB (rotation)
        await deleteRefreshToken(oldRefreshToken);

        // 4. Generate new access token and NEW refresh token
        const newAccessToken = generateAccessToken(payload.userId, payload.email);
        const newRefreshToken = generateRefreshToken(payload.userId, payload.email);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // 5. Store new refresh token (hashed)
        await storeRefreshToken(payload.userId, newRefreshToken, expiresAt);

        // 6. Set new refresh token as cookie (overwrite old one)
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth'
        });

        // 7. Return new access token
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        next(err instanceof AppError ? err : new ForbiddenError('Invalid refresh token'));
    }
};

exports.logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await deleteRefreshToken(refreshToken);
            res.clearCookie('refreshToken', { path: '/api/auth' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new UnauthorizedError('Not authenticated');
        }
        const user = await findUserById(req.user.userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.json(user);
    } catch (err) {
        next(err);
    }
};




// ---------- Forgot Password ----------
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) throw new ValidationError('Email required');

        const user = await findUserByEmail(email);
        // Always respond with generic success (avoid user enumeration)
        if (!user || user.provider !== 'local') {
            // Still return 200 to not leak existence
            return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        // Generate random token (32 bytes hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await saveResetToken(user.id, tokenHash, expiresAt);

        // Build reset URL (frontend route)
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // In development, log to the service logs. In production, send email.
        logger.info('auth-service', 'Password reset link generated', { resetUrl });

        await sendResetEmail(email, resetUrl);
        // TODO: Send email via nodemailer (example below)
        // await sendEmail(email, 'Reset your password', `Click here: ${resetUrl}`);

        res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (err) {
        next(err);
    }
};

// ---------- Reset Password ----------
exports.resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            throw new ValidationError('Token and new password required');
        }
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await findUserByResetToken(tokenHash);
        if (!user) {
            throw new ValidationError('Invalid or expired reset token');
        }
        const passwordStrength = validatePasswordStrength(newPassword);
        if (!passwordStrength.isValid) {
            const err = new ValidationError('Password too weak');
            err.suggestions = passwordStrength.suggestions;
            throw err;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(user.id, hashedPassword);
        await clearResetToken(user.id);

        // Revoke all refresh tokens (logout from all devices)
        // await deleteAllRefreshTokensForUser(user.id);

        res.status(200).json({ message: 'Password reset successfully. Please log in.' });
    } catch (err) {
        next(err);
    }
};

// ---------- Google OAuth ----------
// Set up Google OAuth2 client
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.GOOGLE_REDIRECT_URI}`
);

// Redirect user to Google consent screen
exports.googleAuth = (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('oauth_state', state, {
        httpOnly: true, sameSite: 'lax',
        maxAge: 10 * 60 * 1000, path: '/'
    });
    const url = googleClient.generateAuthUrl({
        access_type: 'offline',
        scope: ['profile', 'email'],
        prompt: 'consent',
        state,
    });
    res.redirect(url);
};

// Handle callback from Google
exports.googleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!state || state !== req.cookies.oauth_state) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
        res.clearCookie('oauth_state', { path: '/' });
        if (!code) throw new Error('No code provided');

        // Exchange code for tokens
        const { tokens } = await googleClient.getToken(code);
        googleClient.setCredentials(tokens);

        // Verify ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        if (!email) throw new Error('Email not provided by Google');

        // Create or find user in our DB
        const user = await findOrCreateOAuthUser('google', googleId, email, name);

        // Generate our own access/refresh tokens
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id, user.email);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await storeRefreshToken(user.id, refreshToken, expiresAt);

        // Set httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth'
        });

        const frontendUrl = `${process.env.FRONTEND_URL}/oauth-callback#accessToken=${accessToken}`;
        res.redirect(frontendUrl);
    } catch (err) {
        if (err.code === 'INVITE_REQUIRED') {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=not_invited`);
        }
        logger.error('auth-service', 'Google OAuth callback failed', { message: err.message, stack: err.stack });
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};

// ---------- GitHub OAuth ----------
exports.githubAuth = (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    res.cookie('oauth_state', state, {
        httpOnly: true, sameSite: 'lax',
        maxAge: 10 * 60 * 1000, path: '/'
    });
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${process.env.GITHUB_CLIENT_ID}&` +
        `redirect_uri=${process.env.GITHUB_REDIRECT_URI}&` +
        `scope=user:email&` +
        `state=${state}`;
    res.redirect(githubAuthUrl);
};

exports.githubCallback = async (req, res) => {
    const { code, state } = req.query;
    if (!state || state !== req.cookies.oauth_state) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
    res.clearCookie('oauth_state', { path: '/' });
    if (!code) return res.status(400).send('No code provided');

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_REDIRECT_URI,
            }),
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        if (!accessToken) throw new Error('No access token from GitHub');

        // Fetch user info from GitHub API
        const userResponse = await fetch('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userData = await userResponse.json();
        const { login: username, id: githubId, avatar_url: picture, email: primaryEmail } = userData;

        // GitHub may not return email if it's private; we need to fetch emails separately
        let email = primaryEmail;
        if (!email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const emails = await emailResponse.json();
            const primary = emails.find(e => e.primary && e.verified);
            email = primary ? primary.email : emails[0]?.email;
            if (!email) throw new Error('No email found for GitHub user');
        }

        // Create or find user in our DB (provider = 'github')
        const user = await findOrCreateOAuthUser('github', String(githubId), email, username);

        // Generate our own tokens
        const newAccessToken = generateAccessToken(user.id, user.email);
        const refreshToken = generateRefreshToken(user.id, user.email);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await storeRefreshToken(user.id, refreshToken, expiresAt);

        // Set refresh token cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/api/auth',
        });

        // Redirect to frontend with access token
        const frontendUrl = `${process.env.FRONTEND_URL}/oauth-callback#accessToken=${newAccessToken}`;
        res.redirect(frontendUrl);
    } catch (err) {
        if (err.code === 'INVITE_REQUIRED') {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=not_invited`);
        }
        logger.error('auth-service', 'GitHub OAuth callback failed', { message: err.message, stack: err.stack });
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};


exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) throw new ValidationError('Token required');

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await findUserByVerificationToken(tokenHash);
        if (!user) throw new ValidationError('Invalid or expired token');

        await verifyEmail(user.id);
        res.status(200).json({ message: 'Email verified successfully.' });
    } catch (err) {
        next(err);
    }
};

// ---------- Invitations ----------
exports.createInvite = async (req, res, next) => {
    try {
        const { email, orgId } = req.body;
        if (!email) throw new ValidationError('Email required');
        let parsedOrgId = null;
        if (orgId != null) {
            parsedOrgId = parseInt(orgId, 10);
            if (Number.isNaN(parsedOrgId)) throw new ValidationError('Invalid orgId');
        }
        const invite = await addAllowedEmail(email, req.user.userId, parsedOrgId);
        res.status(201).json(invite);
    } catch (err) {
        next(err);
    }
};

exports.getInvites = async (req, res, next) => {
    try {
        const { orgId } = req.query;
        const parsedOrgId = orgId != null ? parseInt(orgId, 10) : null;
        const invites = await getAllowedEmails(Number.isNaN(parsedOrgId) ? null : parsedOrgId);
        res.json(invites);
    } catch (err) {
        next(err);
    }
};

exports.revokeInvite = async (req, res, next) => {
    try {
        await revokeAllowedEmail(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};