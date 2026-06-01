const nodemailer = require('nodemailer');


// const transporter = nodemailer.createTransport({
//   host: process.env.EMIAL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "abd7afb8b22993",
    pass: "2d08047fd50cc6"
  }
});

const sendResetEmail = async (to, resetUrl) => {
    const mailOptions = {
        from: '"Auth Service" <noreply@yourapp.com>',
        to,
        subject: 'Password Reset Request',
        html: `
            <p>You requested a password reset.</p>
            <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
            <p>This link expires in 1 hour.</p>
            <p>If you did not request this, ignore this email.</p>
        `,
    };
    await transporter.sendMail(mailOptions);
};

// services/emailService.js
const sendVerificationEmail = async (to, verificationUrl) => {
    const mailOptions = {
        from: '"Auth Service" <noreply@yourapp.com>',
        to:to,
        subject: 'Verify your email address',
        html: `
            <p>Thank you for registering.</p>
            <p>Please click the link below to verify your email address (valid for 24 hours):</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>If you did not create an account, ignore this email.</p>
        `,
    };
    await transporter.sendMail(mailOptions);
};


const zxcvbn = require('zxcvbn');

const validatePasswordStrength = (password) => {
    const result = zxcvbn(password);
    
    // score 0-4; 0 = very weak, 4 = very strong
    const isValid = result.score >= 3;  // require at least 'good' strength
    
    return {
        isValid,
        score: result.score,
        suggestions: result.feedback.suggestions,
        warning: result.feedback.warning,
    };
};

const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, email) => {
  const expiresIn = process.env.JWT_ACCESS_EXPIRY || '15m';
  return jwt.sign({ userId, email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn });
};

// const generateAccessToken = (userId, email) => {
//     return jwt.sign({ userId, email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY });
// };

const generateRefreshToken = (userId, email) => {
    return jwt.sign({ userId, email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY });
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, validatePasswordStrength,  sendResetEmail,sendVerificationEmail };