const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
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











// register function – only the part after creating user changes slightly
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const allowed = await isEmailAllowed(email);
    if (!allowed) {
      return res.status(403).json({ error: 'Registration not permitted for this email address.' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      return res.status(400).json({
        error: 'Password too weak',
        suggestions: passwordStrength.suggestions
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1hr

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Create user (new version returns user object with id, email, username)
    const user = await createUser(email, password);
    await storeVerificationToken(user.id, tokenHash, expiresAt);
    await markEmailAsUsed(email);   // mark the allowed email as used

    try {
      await sendVerificationEmail(email, verificationUrl);
    } catch (emailErr) {
      console.error('Verification email failed, rolling back registration:', emailErr);
      await deleteUserById(user.id);
      await unmarkEmailAsUsed(email);
      return res.status(500).json({ error: 'Registration failed: could not send verification email. Please try again.' });
    }

    return res.status(201).json({
      id: user.id,
      email: user.email,
      message: 'Registration successful. Please verify your email before logging in.'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Registration failed', message: err.message });
  }
};

// login – ensure it works with the joined user object (user.email_verified is now on user, not user.userAuth)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.pass_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
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
    console.error(err);
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
};

// The rest of your controller (refresh, logout, getMe, forgotPassword, resetPassword, OAuth, verifyEmail) should work unchanged,
// because they use the model functions that we have rewritten. No changes needed.

exports.refresh = async (req, res) => {
    try {
        const oldRefreshToken = req.cookies.refreshToken;
        if (!oldRefreshToken) {
            return res.status(401).json({ error: 'No refresh token' });
        }

        // 1. Check DB for old token (exists? not expired?)
        const storedToken = await findRefreshToken(oldRefreshToken); // uses hash lookup
        if (!storedToken || storedToken.expiresAt < new Date()) {
            return res.status(403).json({ error: 'Invalid or expired refresh token' });
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
        console.error(err);
        // If any step fails, ensure the cookie is cleared? Not necessary.
        res.status(403).json({ error: 'Invalid refresh token' });
    }
};

exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await deleteRefreshToken(refreshToken);
            res.clearCookie('refreshToken', { path: '/api/auth' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Logout failed' });
    }
};

exports.getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const user = await findUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('getMe error:', err.stack);
        res.status(500).json({ error: 'Internal error', details: err.message });
    }
};




// ---------- Forgot Password ----------
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

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

        // In development, log to console. In production, send email.
        console.log(`Reset link: ${resetUrl}`);

        await sendResetEmail(email, resetUrl);
        // TODO: Send email via nodemailer (example below)
        // await sendEmail(email, 'Reset your password', `Click here: ${resetUrl}`);

        res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process request', message: err.message });
    }
};

// ---------- Reset Password ----------
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password required' });
        }
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await findUserByResetToken(tokenHash);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        const passwordStrength = validatePasswordStrength(newPassword);
        if (!passwordStrength.isValid) {
            return res.status(400).json({ error: 'Password too weak', suggestions: passwordStrength.suggestions });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await updatePassword(user.id, hashedPassword);
        await clearResetToken(user.id);

        // Revoke all refresh tokens (logout from all devices)
        // await deleteAllRefreshTokensForUser(user.id);

        res.status(200).json({ message: 'Password reset successfully. Please log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reset password', message: err.message });
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
        console.error(err);
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
        console.error(err);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
};


exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ error: 'Token required' });

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const user = await findUserByVerificationToken(tokenHash);
        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        await verifyEmail(user.id);
        res.status(200).json({ message: 'Email verified successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Verification failed', message: err.message });
    }
};

// ---------- Invitations ----------
exports.createInvite = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });
        const invite = await addAllowedEmail(email, req.user.userId);
        res.status(201).json(invite);
    } catch (err) {
        if (err.code === 'ALREADY_EXISTS') {
            return res.status(409).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create invite', message: err.message });
    }
};

exports.getInvites = async (req, res) => {
    try {
        const invites = await getAllowedEmails();
        res.json(invites);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch invites', message: err.message });
    }
};

exports.revokeInvite = async (req, res) => {
    try {
        await revokeAllowedEmail(req.params.id);
        res.status(204).send();
    } catch (err) {
        if (err.code === 'NOT_FOUND') return res.status(404).json({ error: err.message });
        if (err.code === 'ALREADY_USED') return res.status(409).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Failed to revoke invite', message: err.message });
    }
};