const path = require('path');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
});

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

async function ensureAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !username || !password) {
    console.log(
      'ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD not set — skipping admin seed.'
    );
    return;
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username },
      ],
    },
  });

  if (existing) {
    console.log(
      `Admin user already exists: ${existing.email} (${existing.username})`
    );
    return;
  }

  const pass_hash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.create({
    data: {
      email,
      username,
      role: 'Admin',
      userAuth: {
        create: {
          pass_hash,
          provider: 'local',
          email_verified: true,
        },
      },
    },
  });

  console.log(`Admin user created: ${email}`);
}

ensureAdminUser()
  .catch((err) => {
    console.error('Failed to seed admin user:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });