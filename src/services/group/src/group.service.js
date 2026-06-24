const {prisma} = require('../packages/database')
const {NotFoundError, ValidationError, ConflictError} = require('../packages/errors')
const utils = require('../packages/utils')


const createGroup = async ({assId, userId, name, size})=>{
    if(!assId || !userId || !name || !size)
        throw new ValidationError("Invalid request")

    const assignment = await utils.getAssignmentById(assId)
    if(!assignment)
        throw new NotFoundError("Assignment not found")

    const user = await utils.getUserById(userId)
    if(!user)
        throw new NotFoundError("User not found")
    const isEnrolledAndActive = await utils.isEnrolledAndActive(userId, assignment.classid)
    if(!isEnrolledAndActive)
        throw new ConflictError("User is not enrolled in this assignment")
    const isAlreadyMemeber = await utils.existingMembership(userId, assId)
    if(isAlreadyMemeber)
        throw new ConflictError("User is already a member in another group")

    const existingGroupWithName = await prisma.group.findFirst({
        where: {
            assId: parseInt(assId),
            name: name
        }
    })

    if (existingGroupWithName)
        throw new ConflictError("Group name exists already")

    const group = await prisma.group.create({
        data: {
            assId: parseInt(assId),
            name,
            size: parseInt(size),
            leaderId: parseInt(userId),
            members: {
                create: { userId: parseInt(userId) }
            }
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    }
                }
            }
        }
    })
    return group
}

const inviteMember = async (groupId, {leaderId, inviteeId})=>{

    if(!groupId || !leaderId || !inviteeId )
        throw new ValidationError('Invalid request')
    if(parseInt(leaderId) == parseInt(inviteeId))
        throw new ConflictError('WTF bro')

    const user = await utils.getUserById(leaderId)
    if(!user)
        throw new NotFoundError("User Not Found")
    const inviteeUser = await utils.getUserById(inviteeId)
    if(!inviteeUser)
        throw new ConflictError("Invetee user not found")

    const group = await utils.getGroupById(groupId, null, {assignment: true})
    if(!group)
        throw new NotFoundError("Group not found")
    const targetClass = group.assignment.classid
    const inviteeAcEnr = await utils.isEnrolledAndActive(inviteeId, targetClass)
    if(!inviteeAcEnr)
        throw new ConflictError('Invitee is not enrolled or active for this class')
    if(group.leaderId !== parseInt(leaderId))
        throw new ConflictError("User is not allowed to invite")
    const memeberCount = await utils.getGroupCurrentCount(groupId)
    if(memeberCount >= group.size)
        throw new ConflictError("Group is already full")

    const alreadyInvited = await utils.isAlreadyInvited(inviteeId, groupId)
    if(alreadyInvited)
        throw new ConflictError('Invitee is already invited')

    return await prisma.groupInvite.create({
        data:{senderId: parseInt(leaderId), reciverId: parseInt(inviteeId),
            targetGroupId: parseInt(groupId), status: 'Pending'
        }
    })
}

// add member to an existing group (as bocal)
const addMemberAdmin = async (groupId, { userId }) => {
    if (!groupId || !userId)
        throw new ValidationError('Invalid request')
    const group = await utils.getGroupById(groupId, null, { assignment: true })
    if (!group)
        throw new NotFoundError('Group not found')
    const user = await utils.getUserById(userId)
    if (!user)
        throw new NotFoundError('User not found')

    const targetClass = group.assignment.classid
    const isEnrolledAndActive = await utils.isEnrolledAndActive(userId, targetClass)
    if (!isEnrolledAndActive)
        throw new ConflictError('User is not enrolled or active for this class')
    const existingMembership = await utils.existingMembership(userId, group.assId)
    if (existingMembership)
        throw new ConflictError('User is already a member of a group for this assignment')

    await prisma.groupMember.create({ data: { userId: parseInt(userId), groupId: parseInt(groupId) } })

    const memberCount = await utils.getGroupCurrentCount(groupId)
    if (memberCount > group.size) {
        await prisma.group.update({
            where: { id: parseInt(groupId) },
            data: { size: memberCount } })
    }

    return await prisma.group.findUnique({
        where: { id: parseInt(groupId) },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true
                        }
                    }
                }
            }
        }
    })
}


const removeMemberAdmin = async (groupId, { userId }) => {
    if (!groupId || !userId)
        throw new ValidationError('Invalid request')

    const group = await utils.getGroupById(groupId, null, {
        members: {
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true } } } } })
    if (!group)
        throw new NotFoundError('Group not found')
    const userIdInt = parseInt(userId)
    const groupIdInt = parseInt(groupId)
    const memberToRemove = group.members.find(member => member.userId === userIdInt)
    if (!memberToRemove)
        throw new ConflictError('User is not a member of this group')
    if (group.members.length <= 1)
        throw new ConflictError('Cannot remove the last member of a group. Remove the whole group instead.')
    await prisma.groupMember.delete({ where: { userId_groupId: { userId: userIdInt, groupId: groupIdInt }}})

    if (group.leaderId === userIdInt) {
        const newLeader = group.members.find(member => member.userId !== userIdInt)
        if (!newLeader)
            throw new ConflictError('Could not assign a new group leader')
        await prisma.group.update({ where: { id: groupIdInt }, data: { leaderId: newLeader.userId } })
    }
    const memberCount = await utils.getGroupCurrentCount(groupId)
    await prisma.group.update({ where: { id: groupIdInt }, data: { size: memberCount } })
    return await prisma.group.findUnique({
        where: { id: groupIdInt },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true } } } } } })
}

//get the group profile
const getGroup = async(groupId)=>{
    if(!groupId)
        throw new ValidationError('Invalid request')

    const group = await utils.getGroupById(groupId, null, {members: {include: {user: true}}})
    if(!group)
        throw new NotFoundError('Group not found')
    return group
}

//gets the invite
const getInvites = async({userId})=>{
    if(!userId)
        throw new ValidationError('Invalid request')
    const invites = await prisma.groupInvite.findMany({
        where:{reciverId: parseInt(userId), status: 'Pending'},
        include:{targetGroup: true, senderUser: true}
    })
    return invites
}

const leaveGroup = async(groupId, {userId})=>{
    if(!groupId || !userId)
        throw new ValidationError('Invalid request')

    const group = await utils.getGroupById(groupId)
    if(!group)
        throw new NotFoundError('Group not found')
    const isMemeber = await utils.existingMembership(userId, group.assId)
    if(!isMemeber)
        throw new ConflictError('User is not a member of this group')
    if(group.leaderId === parseInt(userId))
        throw new ConflictError('Group leader cannot leave the group')
    await prisma.groupMember.delete({
        where:{userId_groupId: {userId: parseInt(userId), groupId: parseInt(groupId)}}
    })
    return {message: 'Left the group successfully'}
}

const deleteInvite = async(inviteId)=>{
    if(!inviteId)
        throw new ValidationError('Invalid request')
    const invite = await utils.getinvite(inviteId)
    if(!invite)
        throw new NotFoundError('Invite Not Found')
    await prisma.groupInvite.delete({
        where:{id: parseInt(inviteId)}
    })
    return {message: 'Invite deleted successfully'}
}
    
const respondToInvite = async(inviteId, {userId, status})=>{
    if(!inviteId || !userId || !status)
        throw new ConflictError('Invalid request')
    if(status === 'Pending')
        throw new ConflictError('Invalid request')

    const invite = await utils.getinvite(inviteId)
    if(!invite)
        throw new NotFoundError('Invite Not Found')
    if(invite.status !== 'Pending')
        throw new ConflictError('Invalid invite')

    const user = await utils.getUserById(userId)
    if(!user)
        throw new NotFoundError('User not found')
    if(invite.reciverId !== parseInt(userId))
        throw new ConflictError('invite error')

    const updatedinvite = await prisma.groupInvite.update({
        where:{id: parseInt(inviteId)},
        data:{status},
        include:{targetGroup: true}
    })
    if(status === 'Accepted')
    {
        await prisma.groupMember.create({
            data:{userId: invite.reciverId, groupId: invite.targetGroupId}
        })
    }
    return {
        message: status == 'Accepted' ? 'Invite accepted successfully'
        :'invite declined successfully',
        invite: updatedinvite,
        group:updatedinvite.targetGroup
    }
}

//list all groups for an assignment (staff management)
const getGroupsForAssignment = async (assId)=>{
    if(!assId)
        throw new ValidationError('Invalid request')

    const assignment = await utils.getAssignmentById(assId)
    if(!assignment)
        throw new NotFoundError('Assignment not found')

    return await prisma.group.findMany({
        where: {assId: parseInt(assId)},
        include: {members: {include: {user: {select: {id: true, username: true, email: true}}}}}
    })
}

//staff/admin removal of a group (members/submissions cascade per schema)
const deleteGroup = async (groupId)=>{
    if(!groupId)
        throw new ValidationError('Invalid request')

    const group = await utils.getGroupById(groupId)
    if(!group)
        throw new NotFoundError('Group not found')

    await prisma.group.delete({where: {id: parseInt(groupId)}})
    return {message: 'Group deleted successfully', id: groupId}
}

const getMyGroupForAssignment = async ({ userId, assId }) => {
    if (!userId || !assId)
        throw new ValidationError('Invalid request')
    const membership = await utils.existingMembership(userId, assId, {
        group: {
            include: {
                members: { include: { user: true } }
            }
        }
    })
    return membership?.group ?? null
}

module.exports = {createGroup, inviteMember, addMemberAdmin, removeMemberAdmin, respondToInvite, getGroup, leaveGroup, 
    deleteInvite, getInvites, getMyGroupForAssignment, getGroupsForAssignment, deleteGroup}
  