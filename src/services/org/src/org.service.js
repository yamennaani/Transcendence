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
    if(!org) throw new NotFoundError("Error Org not found")
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
    const targetOrg = await getOrg(orgId);

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
            select: {id: true, username: true, role: true, created_at: true}
        })
    }
    else
    {
        return prisma.user.create({
            data: {username, email, role:role, orgId:parseInt(orgId)},
            select: {id: true, username: true, role: true, created_at: true}
        })
    }
}

const removeMember = async (orgId, {email})=>{
    const org = await getOrg(orgId)
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
  const org = await getOrg(orgId)
  await prisma.organization.delete({where: {id: parseInt(orgId)}})

  return{
      message: 'Organization deleted successfully',
      userId: parseInt(orgId)
  }
}

const listOrgMembers = async (orgId) => {
  const id = parseInt(orgId)

  const org = await getOrg(id)
  if (!org) throw new NotFoundError('Organization not found')

  return await prisma.user.findMany({
    where: {orgId: id},
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      created_at: true
    }
  })
}



module.exports = {getAllOrgs, getOrg, createOrg, createMember, removeMember, deleteOrg, listOrgMembers}
