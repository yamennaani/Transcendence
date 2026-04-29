const { prisma } = require('../../database')

const getSubmissionCount = async(groupId)=>{
    return await prisma.submission.count({
        where:{groupId: parseInt(groupId)}
    })
}

const getLastSubmission = async (groupId, include = null)=>{
    const option = {
        where: {groupId: parseInt(groupId)},
        orderBy:{createdAt: 'desc'}
    }
    if(include)
        option.include = include
    return await prisma.submission.findFirst(option)
}

const getGroupSubmissionStats = async (groupId) => {
    const groupIdInt = parseInt(groupId)
    
    // Get count of submissions
    const submissionCount = await prisma.submission.count({
        where: { groupId: groupIdInt }
    })
    
    // Get last submission (most recent)
    const lastSubmission = await prisma.submission.findFirst({
        where: { groupId: groupIdInt },
        orderBy: { createdAt: 'desc' }  // Get the newest first
    })
    
    return {
        count: submissionCount,
        lastSubmission: lastSubmission
    }
}

const getAssignment = async(assId, select = null, include = null)=>{
    const options = {where: {id: parseInt(assId)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.assignment.findUnique(options)
}

const getSubmissionsBy = async (where)=>{
    if(!where)
        return null
    const options = {}
    options.where = where
    return await prisma.submission.findMany(options)
}

module.exports = {getSubmissionCount, getLastSubmission, 
    getGroupSubmissionStats,getSubmissionsBy,
    getAssignment, 
}