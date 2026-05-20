const { prisma } = require('../packages/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

const generateUsername = async (email) => {
  let base = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (!base) base = 'user';
  let username = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.$queryRaw`SELECT id FROM "user" WHERE username = ${username}`;
    if (existing.length === 0) return username;
    username = `${base}${counter++}`;
  }
};

// ========== USERS ==========
const createUser = async (email, plainPassword) => {
  const hashed = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  const username = await generateUsername(email);
  const userRows = await prisma.$queryRaw`
    INSERT INTO "user" (email, username, role, created_at)
    VALUES (${email}, ${username}, 'Student', NOW())
    RETURNING id, email, username, created_at
  `;
  const user = userRows[0];
  await prisma.$executeRaw`
    INSERT INTO "userAuth" ("userId", pass_hash, provider, email_verified)
    VALUES (${user.id}, ${hashed}, 'local', false)
  `;
  return user;
};

const findUserByEmail = async (email) => {
  const rows = await prisma.$queryRaw`
    SELECT u.id, u.email, u.username, u.role,
           ua.pass_hash, ua.provider, ua.email_verified,
           ua.verification_token_hash, ua.verification_token_expiry,
           ua.reset_token_hash, ua.reset_token_expiry
    FROM "user" u
    LEFT JOIN "userAuth" ua ON u.id = ua."userId"
    WHERE u.email = ${email}
  `;
  return rows[0];
};

// ========== REFRESH TOKENS (fixed camelCase) ==========
const storeRefreshToken = async (userId, refreshToken, expiresAt) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.$executeRaw`
    INSERT INTO "refreshToken" ("tokenHash", "userId", "expiresAt", "CreatedAt")
    VALUES (${tokenHash}, ${userId}, ${expiresAt}, NOW())
  `;
};

const findRefreshToken = async (refreshToken) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const rows = await prisma.$queryRaw`
    SELECT * FROM "refreshToken"
    WHERE "tokenHash" = ${tokenHash}
  `;
  return rows[0];
};

const deleteRefreshToken = async (refreshToken) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.$executeRaw`
    DELETE FROM "refreshToken" WHERE "tokenHash" = ${tokenHash}
  `;
};

const deleteAllUserRefreshTokens = async (userId) => {
  await prisma.$executeRaw`
    DELETE FROM "refreshToken" WHERE "userId" = ${userId}
  `;
};

// ========== OAUTH ==========
const findOrCreateOAuthUser = async (provider, providerUserId, email, name, picture) => {
  let rows = await prisma.$queryRaw`
    SELECT u.id, u.email, u.username, ua.provider, ua.provider_user_id, ua.email_verified
    FROM "user" u
    JOIN "userAuth" ua ON u.id = ua."userId"
    WHERE ua.provider = ${provider} AND ua.provider_user_id = ${providerUserId}
  `;
  let user = rows[0];
  if (!user) {
    const existingEmail = await prisma.$queryRaw`
      SELECT u.id FROM "user" u
      JOIN "userAuth" ua ON u.id = ua."userId"
      WHERE u.email = ${email} AND ua.provider = 'local'
    `;
    if (existingEmail.length > 0) {
      throw new Error('Email already registered with password. Please login using password.');
    }
    const username = await generateUsername(email);
    const userRows = await prisma.$queryRaw`
      INSERT INTO "user" (email, username, role, created_at)
      VALUES (${email}, ${username}, 'Student', NOW())
      RETURNING id, email, username
    `;
    user = userRows[0];
    await prisma.$executeRaw`
      INSERT INTO "userAuth" ("userId", provider, provider_user_id, email_verified, picture)
      VALUES (${user.id}, ${provider}, ${providerUserId}, true, ${picture || null})
    `;
    user.email_verified = true;
  }
  return user;
};

// ========== PASSWORD RESET ==========
const saveResetToken = async (userId, tokenHash, expiresAt) => {
  await prisma.$executeRaw`
    UPDATE "userAuth"
    SET reset_token_hash = ${tokenHash}, reset_token_expiry = ${expiresAt}
    WHERE "userId" = ${userId}
  `;
};

const findUserByResetToken = async (tokenHash) => {
  const rows = await prisma.$queryRaw`
    SELECT u.id, u.email, ua.pass_hash
    FROM "user" u
    JOIN "userAuth" ua ON u.id = ua."userId"
    WHERE ua.reset_token_hash = ${tokenHash}
      AND ua.reset_token_expiry > NOW()
  `;
  return rows[0];
};

const clearResetToken = async (userId) => {
  await prisma.$executeRaw`
    UPDATE "userAuth"
    SET reset_token_hash = NULL, reset_token_expiry = NULL
    WHERE "userId" = ${userId}
  `;
};

const updatePassword = async (userId, newHashedPassword) => {
  await prisma.$executeRaw`
    UPDATE "userAuth"
    SET pass_hash = ${newHashedPassword}
    WHERE "userId" = ${userId}
  `;
};

// ========== EMAIL VERIFICATION ==========
const storeVerificationToken = async (userId, tokenHash, expiresAt) => {
  await prisma.$executeRaw`
    UPDATE "userAuth"
    SET verification_token_hash = ${tokenHash}, verification_token_expiry = ${expiresAt}
    WHERE "userId" = ${userId}
  `;
};

const findUserByVerificationToken = async (tokenHash) => {
  const rows = await prisma.$queryRaw`
    SELECT u.id, u.email
    FROM "user" u
    JOIN "userAuth" ua ON u.id = ua."userId"
    WHERE ua.verification_token_hash = ${tokenHash}
      AND ua.verification_token_expiry > NOW()
  `;
  return rows[0];
};

const verifyEmail = async (userId) => {
  await prisma.$executeRaw`
    UPDATE "userAuth"
    SET email_verified = true,
        verification_token_hash = NULL,
        verification_token_expiry = NULL
    WHERE "userId" = ${userId}
  `;
};

// ========== ALLOWED EMAILS ==========
const isEmailAllowed = async (email) => {
  const rows = await prisma.$queryRaw`
    SELECT 1 FROM auth_allowed_emails
    WHERE email = ${email} AND (used = false OR used IS NULL)
  `;
  return rows.length > 0;
};

const markEmailAsUsed = async (email) => {
  await prisma.$executeRaw`
    UPDATE auth_allowed_emails SET used = true WHERE email = ${email}
  `;
};

module.exports = {
  createUser,
  findUserByEmail,
  findOrCreateOAuthUser,
  storeRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens,
  saveResetToken,
  findUserByResetToken,
  clearResetToken,
  updatePassword,
  storeVerificationToken,
  findUserByVerificationToken,
  verifyEmail,
  isEmailAllowed,
  markEmailAsUsed,
};