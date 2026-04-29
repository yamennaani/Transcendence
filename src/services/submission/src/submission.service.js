const {prisma} = require('../packages/database')
const {NotFoundError, ValidationError, ConflictError, UnauthorizedError} = require('../packages/errors')
const utils = require('../packages/utils')
const minio = require('./minio')

const validateGroupMember = async (groupId, userId)=>{
     const group = await utils.getGroupById(groupId, null, {
        assignment: {
            include:{
                class:{
                    select:{
                        id: true,
                        name: true
                    }
                }
            }
        }
    })
     if(!group)
        throw new NotFoundError('Group not found')
    const assId = group.assignment.id;
    const classId = group.assignment.class.id;

    const user = await utils.getUserById(userId)
    if(!user)
        throw new NotFoundError('User not found')
    const userEnrAct = await utils.isEnrolledAndActive(userId, classId)
    if(!userEnrAct)
        throw new ValidationError('User is not Enrolled into this class')
    const memberShip = await utils.existingMembership(userId, assId)
    if(!memberShip)
        throw new NotFoundError('Membership not found')
    if(memberShip.groupId != groupId)
        throw new ValidationError('Membership validation error')
    return {group, user, assId, classId}
}

const getGroupSubmissions = async (groupId) => {
    if(!groupId)
        throw new ValidationError('Invalid request')

    // Include submissions in the query
    const group = await utils.getGroupById(groupId, null, { submissions: true })
    
    if(!group)
        throw new NotFoundError("Group Not Found")
    
    return group.submissions
}

const createSubmission = async({groupId, userId, type})=>{
    if(!groupId || !userId || !type)
        throw new ValidationError('Invalid request')
    await validateGroupMember(groupId, userId)
    const existingSub = await utils.getLastSubmission(groupId)
    if(existingSub)
    {
        if(existingSub.status !== 'Close')
            throw new ConflictError('Cannot Create new submission')
    }
    return await prisma.submission.create({
        data:{groupId: parseInt(groupId), status: 'Open', type}
    })
}


const closeSubmission = async (groupId, {userId})=>{
    if(!groupId || !userId)
        throw new ValidationError('Invalid request')
    const {group, user} = await validateGroupMember(groupId, userId)
    console.log(user)
    if(user.id !== group.leaderId)
        throw new UnauthorizedError('the user is not the leader')

    const existingSub = await utils.getLastSubmission(groupId)
    if(!existingSub)
        throw new NotFoundError('Submission not found')
    if(existingSub.status != 'Open')
        throw new ValidationError('Submission is already closed')

    return await prisma.submission.update({
        where: { id: existingSub.id },
        data: { status: 'Close' }
    })
}

const deleteExistingFile = async(url)=>{
    if(!url.startsWith('http')){
        await minio.deleteFromMinio(url)
    }
}

const uploadFile = async (groupId, userId, reqFile)=>{
    if(!groupId || !userId || !reqFile)
        throw new ValidationError('Invalid request')

    await validateGroupMember(groupId, userId)

    const existingSub = await utils.getLastSubmission(groupId, {file: true})

    if(!existingSub)
        throw new NotFoundError('Submission not found')
    if(existingSub.status != 'Open')
        throw new ValidationError('Submission is already closed')

    const fileName = `${groupId}-${Date.now()}-${reqFile.originalname}`
    await minio.uploadToMinio(fileName, reqFile.buffer, reqFile.mimetype, reqFile.size)
    if(existingSub.file)
    {
        await deleteExistingFile(existingSub.file.url);
        return await prisma.file.update(
            {
                where: {id: existingSub.file.id},
                data:{name: reqFile.originalname, size: reqFile.size, 
                    mimiType: reqFile.mimetype, url: fileName,
                uploadedBy: parseInt(userId)}
            })
    }

    const newFile = await prisma.file.create({
        data: {name: reqFile.originalname, size: reqFile.size, 
            mimiType: reqFile.mimetype, url: fileName, 
            uploadedBy : parseInt(userId)}
    })
    return await prisma.submission.update({
        where: {id: parseInt(existingSub.id)},
        data:{fileId: newFile.id}})
}

const getDownloadUrl = async(groupId, userId)=>{
    if(!groupId || !userId) 
        throw new ValidationError('Invalid Request')
    await validateGroupMember(groupId, userId)
    const existingSub = await utils.getLastSubmission(groupId, {file: true})
    if(!existingSub) throw new NotFoundError('Submission not found')
    if(!existingSub.file) throw new NotFoundError('File not found')
    
    const url = await minio.getSignedUrl(existingSub.file.url, existingSub.file.name)
    return {url, expiresIn: '10 minutes' }
}

const removeFile = async (groupId, userId) =>{
    if(!groupId || !userId)
        throw new ValidationError('Invalid request')
    await validateGroupMember(groupId, userId)
    const existingSub = await utils.getLastSubmission(groupId, {file: true})
    if(!existingSub) throw new NotFoundError('Submission not found')
    if(!existingSub.file) throw new NotFoundError('File not found')
    if(existingSub.status !== 'Open') throw new ValidationError('Submission is already closed')
    
    await minio.deleteFromMinio(existingSub.file.url)
    await prisma.submission.update({
        where:{id: existingSub.id},
        data:{fileId: null}
    })
    await prisma.file.delete({where: {id: existingSub.file.id }})

    return { message: 'File deleted successfully' }
}

const getSubmissionsForAssignment = async (assId)=>{
    const ass = await utils.getAssignment(assId)
    if(!ass)
        throw new NotFoundError('Assignment not found')
    return utils.getSubmissionsBy({group:{assId: parseInt(assId)}})
}

module.exports = {
  getGroupSubmissions, createSubmission, closeSubmission,
  uploadFile, getDownloadUrl, removeFile, getSubmissionsForAssignment
}