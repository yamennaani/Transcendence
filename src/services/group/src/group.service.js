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
        throw new ConflictError("User is already a memeber in another group")

    const group = await prisma.group.create({
        data:{assId: parseInt(assId), name, size: parseInt(size), 
            leaderId: parseInt(userId),
            members:{
                create: {userId: parseInt(userId)}
            }
        },
        include: {members: true}
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

module.exports = {createGroup, inviteMember, respondToInvite}