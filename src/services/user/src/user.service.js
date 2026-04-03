const { prisma } = require('../packages/database')
const { NotFoundError } = require('../packages/errors')
const logger = require('../packages/logger')
const bcrypt = require('bcrypt')

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { id: true, email: true, username: true, created_at: true }
  })
}

const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, email: true, username: true, created_at: true }
  })
  if (!user) throw new NotFoundError('User not found')
  return user
}

const createUser = async ({ email, username, password }) => {
  const pass_hash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      username,
      userAuth: { create: { pass_hash } }
    },
    select: { id: true, email: true, username: true, created_at: true }
  })
  logger.info('user-service', 'User created', { userId: user.id })
  return user
}

module.exports = { getAllUsers, getUserById, createUser }