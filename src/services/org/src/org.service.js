const {NotFoundError, ConflictError, ValidationError} = require('../packages/errors')
const { prisma } = require('../packages/database')
const logger = require('../packages/logger')
const utils = require('../packages/utils')

const getAllOrgs = async ()=>{
    const select = {id: true, email: true, name: true, tag: true}
    return await utils.getAllOrgs(select)
}

const getOrg = async (id)=>{
    const org = await utils.getOrgById(id)
    if(!org) throw new NotFoundError("Error Organization not found")
    return org;
}

const createOrg = async ({email, orgname, tag})=>{
    const exist = await utils.searchOrg(email, orgname)
    if(exist)
        throw new ConflictError("Email or orgname already taken");
    const org = await prisma.organization.create({
        data:{
            email: email,
            name: orgname,
            tag: tag
        },
        select: {id: true, email: true, name: true, created_at:true}
    })
    logger.info('org-service', 'Org Created', { orgId: org.id})
    return org;
}

const createMember = async (orgId, {email, username, role}) =>{
    await getOrg(parseInt(orgId));

    if(!email || !username || !role)
        throw new ValidationError('email, username and role are required')

    const validRoles = ["Admin", "Bocal", "Student"]
    if (!validRoles.includes(role)) throw new ValidationError('Invalid role')
    
    const existingByEmail = await prisma.user.findUnique({ where: { email } })
    const existingByUsername = await prisma.user.findUnique({ where: { username } })

    if (existingByEmail && existingByUsername && existingByEmail.id !== existingByUsername.id) {
    throw new ConflictError('Email and username belong to different users')
    }

    const user = existingByEmail || existingByUsername
    //const user = await utils.searchUser(email, username)
    if(user){
        return prisma.user.update({
            where:{ id: user.id },
            data:{orgId:parseInt(orgId), role: role},
            select: {id: true, username: true, role: true, created_at: true} })
    }
    else
    {
        return prisma.user.create({
            data: {username, email, role:role, orgId:parseInt(orgId)},
            select: {id: true, username: true, role: true, created_at: true} })
    }
}

const removeMember = async (orgId, {email})=>{
    const id = parseInt(orgId)
    await getOrg(id)
    if(!email)
        throw new ValidationError("email is missing")

    const user =  await utils.searchUser(email, null)

    if(!user) 
        throw new NotFoundError('User not found')

    return prisma.user.update({
        where: {email}, 
        data: {role: 'Student', orgId: null},
        select: {id: true, username: true, role: true}})
}


const deleteOrg = async (orgId)=>{
  const id = parseInt(orgId)
  await getOrg(id)
  await prisma.organization.delete({where: {id: id}})

  return{
      message: 'Organization deleted successfully',
      orgId: id}
}

const listOrgMembers = async (orgId) => {
  const id = parseInt(orgId)
  await getOrg(id)
  return await prisma.user.findMany({
    where: {orgId: id},
    select: {id: true, email: true, username: true, role: true, created_at: true }})
}

// create or update org profile:
const createOrgProfile = async (orgId, { bio, tel_num }) => {
  const id = parseInt(orgId)

  const org = await getOrg(id)
  if (!org)
    throw new NotFoundError('Organization not found')

  if (!bio || !tel_num)
    throw new ValidationError('bio and tel_num are required')

  return prisma.orgProfile.upsert({
    where: { orgid: id },
    update: { bio, tel_num },
    create: { bio, tel_num, orgid: id },
    select: { id: true, bio: true, tel_num: true, orgid: true } })
}


const getOrgProfile = async (orgId) => {
    const id = parseInt(orgId)
    await getOrg(id)
  
    const profile = await prisma.orgProfile.findUnique({
      where: { orgid: id },
      select: { id: true, bio: true, tel_num: true, orgid: true } })
  
    if (!profile)
      throw new NotFoundError('Organization profile not found')
  
    return profile
  }

  const deleteOrgProfile = async (orgId)=>{
    const id = parseInt(orgId)
    await getOrg(id)
    
    const profile = await prisma.orgProfile.findUnique({
        where: { orgid: id } })
    
      if (!profile)
        throw new NotFoundError('Organization profile not found')

    await prisma.orgProfile.delete({where: {orgid: id}})
 
    return {
        message: 'Organization profile deleted successfully',
        orgId: id }
  }


  const getOrgCourses = async (orgId) => {
    const id = parseInt(orgId)
    await getOrg(id)
  
    const courses = await prisma.class.findMany({
      where: { org_id: id },
      select: { id: true, name: true, description: true, org_id: true, created_at: true } })
  
    return courses
  }


module.exports = {getAllOrgs, getOrg, createOrg, createMember, removeMember, deleteOrg, listOrgMembers, createOrgProfile, getOrgProfile, deleteOrgProfile, getOrgCourses}
