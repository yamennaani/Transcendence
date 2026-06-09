const { prisma } = require('../packages/database')
const { NotFoundError, ConflictError, ValidationError } = require('../packages/errors')
const utils = require('../packages/utils')
const logger = require('../packages/logger')
const bcrypt = require('bcrypt')
const {createStorage} = require('../packages/fileManager')

let storage
(async () => {
  storage = createStorage('user-profile')
  await storage.ensureBucket()
  await storage.makePublic()
})().catch(err => logger.error('Failed to initialize storage:', err))

//const url = storage.getPublicUrl(fileName)


const uploadAvatar = async (userId, reqFile) => {
  if (!userId || !reqFile)
    throw new ValidationError('Invalid request')
  
  const user = await utils.getUserById(userId)
  if (!user)
    throw new NotFoundError('User not found')

  const fileName = `avatar-${userId}-${Date.now()}-${reqFile.originalname}`
  await storage.upload(fileName, reqFile.buffer, reqFile.mimetype, reqFile.size)
  const publicUrl = storage.getPublicUrl(fileName)

  // save the url to user profile
  await prisma.userProfile.upsert({
    where:  { userId: parseInt(userId) },
    update: { avatar: publicUrl, last_update: new Date() },
    create: { userId: parseInt(userId), avatar: publicUrl, bio: '', last_update: new Date() },
  })

  return { message: 'Avatar uploaded', url: publicUrl }
}

const getAllUsers = async () => {
  const select = { id: true, email: true, username: true, created_at: true }
  return await utils.getAllUsers(select)
}

const getUserById = async (id) => {
  const select = {id: true, email: true, username: true, created_at: true }
  const user = await utils.getUserById(id, select)
  if (!user) throw new NotFoundError('User not found')
  return user
}

const createUser = async ({ email, username, password }) => {
  if(!email || !username || !password)
    throw new ValidationError('Invalid request')
  
  const existing = await utils.searchUser(email, username)
  if(existing) throw new ConflictError('Email or username already taken')
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

//Havent tested it yet
const getRole = async (id) => {
  const select = { id: true, role: true }
  const user = await utils.getUserById(id, select)
  if (!user) 
    throw new NotFoundError('User not found')
  return { role: user.role }
}

const loginUser = async ({ email, username, password }) => {
  if (!email && !username) 
    throw new ValidationError('Email or username required')
  if (!password) 
    throw new ValidationError('Password required')
  const user = await utils.searchUser(email, username, null, {profile: true})
  if (!user) 
    throw new NotFoundError('User not found');
  //if (!await bcrypt.compare(password, user.userAuth.pass_hash)) 
    //throw new ValidationError('Invalid password');
  return user;
}

const getProfile = async (id)=>{
  const profile = await utils.getUserProfile(id)
  if(!profile) throw new NotFoundError('Profile not found')
  return profile;
}

const updateProfile = async (id, bio)=>{
  const profile = await prisma.userProfile.upsert({
    where: {userId: parseInt(id)},
    update: {bio, last_update: new Date()},
    create: {userId: parseInt(id), bio, last_update: new Date()}
  })
  return profile;
}

const deleteUser = async (id)=>{
  const user = await utils.getUserById(id)
  if(!user) throw new NotFoundError('User not found')
  await prisma.user.delete({where: {id: parseInt(id)}})

  return{
      message: 'User deleted successfully',
      userId: parseInt(id)
  }
}


module.exports = { getAllUsers, getUserById, getRole, createUser, getProfile, updateProfile, deleteUser, loginUser, uploadAvatar}