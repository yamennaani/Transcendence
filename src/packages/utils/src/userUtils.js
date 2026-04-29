const { prisma } = require('../../database')

const getAllUsers = async (select = null)=>{
    const options = { };
    if(select)
        options.select = select
    return await prisma.user.findMany(options)
}

const getUserById = async (id, select = null, include = null)=>{
    if (!id || isNaN(id))
        throw new Error('Invalid user ID');
    const options = {where: {id: parseInt(id)}}
    if(select)
        options.select = select;
    if(include)
        options.include = include
    return await prisma.user.findUnique(options)
}

const searchUser = async (email, username, select = null, include = null)=>{
    const filter = []
    if(email)
        filter.push({email})
    if(username)
        filter.push({username})

    if(filter.length === 0) return null
    const options = {where: {OR:filter}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    console.log(options)
    return await prisma.user.findFirst(options)
}

const getUserProfile = async (id, select = null)=>{
    if (!id || isNaN(id))
        throw new Error('Invalid user ID');
    const options = {where: {id: parseInt(id)}}
    if(select)
        options.select = select
    return await prisma.userProfile.findUnique(options)
}

const existingMembership = async (userId, assId, include = null)=>{
    const options = {where: {
        userId: parseInt(userId),
        group: {assId: parseInt(assId)}
    }}
    if(include)
        options.include = include
    return await prisma.groupMember.findFirst(options)
}

const getGroupById = async(id, select = null, include = null)=>{
    if (!id || isNaN(id))
        throw new Error('Invalid group ID');
    const options = {where: {id: parseInt(id)}}
    if(select)
        options.select = select;
    if(include)
        options.include = include
    return await prisma.group.findUnique(options)
}

const getGroupCurrentCount = async(id)=>{
    return await prisma.groupMember.count({
        where: {groupId: parseInt(id)}
    })
}

const getinvite = async (inviteId, select = null, include = null)=>{
    const options = {where:{id: parseInt(inviteId)}}
    if(select)
        options.select = select
    if(include)
        options.include = include

    return await prisma.groupInvite.findUnique(options)
}

const isAlreadyInvited = async (inviteeId, groupId)=>{
    return await prisma.groupInvite.findFirst({
        where:{targetGroupId: parseInt(groupId), reciverId: parseInt(inviteeId)}
    })
}


module.exports = {getUserById, getUserProfile, searchUser, getAllUsers, 
    existingMembership, getGroupById, getGroupCurrentCount,
    getinvite, isAlreadyInvited}